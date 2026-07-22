import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import { CATEGORY_QUERIES, fetchPlaces } from './places.js';
import { enforceQuota, requireAuth, supabaseAdmin } from './auth.js';

// Qwen is served through Hugging Face's Inference Providers router, which is
// OpenAI-compatible. HF_MODEL can be "<hf-model-id>" (router picks a provider
// that serves it) or "<hf-model-id>:<provider>" to pin one explicitly.
const HF_TOKEN = process.env.HF_TOKEN;
const HF_BASE_URL = process.env.HF_BASE_URL ?? 'https://router.huggingface.co/v1';
const HF_MODEL = process.env.HF_MODEL ?? 'Qwen/Qwen2.5-72B-Instruct';
// Places come from SerpApi's Google Maps engines, not Google's own Places
// API — see the comment in places.js for why.
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const PORT = process.env.PORT ?? 3000;

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map();
const PLACES_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const placesCache = new Map();

function cacheKey(location, category, places) {
  const ids = places.map((place) => place.id).sort().join(',');
  return `${location.toLowerCase()}::${category}::${ids}`;
}

function buildMessages(location, category, places) {
  const candidates = places.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    rating: place.rating,
    reviewCount: place.reviewCount,
    reviews: place.topReviews.map((review) => ({
      rating: review.rating,
      date: review.date,
      text: review.text,
    })),
  }));

  return [
    {
      role: 'system',
      content:
        'You are a local expert curating "best of" travel recommendations from Google review data. ' +
        'You will be given candidate places with their star rating, review count, and a sample of recent ' +
        'reviews. Rank them by genuine quality signal rather than raw star average — weigh review recency, ' +
        'review depth, and specific enthusiastic detail in the review text over generic praise. ' +
        'Respond with ONLY a JSON object, no markdown formatting: ' +
        '{"recommendations":[{"id":string,"score":number between 0 and 100,"highlight":string, at most 20 words, ' +
        'a specific reason this place is worth the traveler\'s time drawn from the reviews}]}. ' +
        'Include every candidate id exactly once, ordered best first.',
    },
    {
      role: 'user',
      content: `Location: ${location}\nCategory: ${category}\nCandidates:\n${JSON.stringify(candidates)}`,
    },
  ];
}

// Some providers routed through HF ignore response_format and wrap JSON in
// prose or a ```json fence, so extract the outermost {...} rather than
// assuming the content is bare JSON.
function extractJson(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : content;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in model response');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

async function getQwenRecommendations(location, category, places) {
  const response = await fetch(`${HF_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HF_TOKEN}`,
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: buildMessages(location, category, places),
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API error ${response.status}: ${errorText}`);
  }

  const completion = await response.json();
  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Hugging Face response had no message content');
  }
  const parsed = extractJson(content);

  if (!Array.isArray(parsed.recommendations)) {
    throw new Error('Model response did not include a recommendations array');
  }

  const validIds = new Set(places.map((place) => place.id));
  const recommendations = parsed.recommendations.filter(
    (rec) => rec && validIds.has(rec.id) && typeof rec.score === 'number'
  );

  if (recommendations.length === 0) {
    throw new Error('Model response contained no recommendations matching the request');
  }

  return recommendations;
}

const app = express();
// Render (like most PaaS) puts the app behind a reverse proxy, so without
// this every request looks like it comes from the same internal IP and the
// limiter below would apply globally instead of per client.
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Per-IP stopgap against abuse of the paid-per-call SerpApi/Qwen endpoints
// until real per-user accounts + quotas exist. Not applied to /health.
const paidApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again later.' },
});

// Supabase's confirmation email links redirect here (Site URL in Auth
// settings) once the email is verified server-side. Without this, the
// redirect falls through to Supabase's default (often an unreachable
// localhost URL), which looks broken even though confirmation succeeded.
app.get('/confirmed', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Find Fun</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #ff0080, #ff8c00);
      font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif;
    }
    .card {
      max-width: 360px;
      padding: 32px 28px;
      text-align: center;
    }
    .badge {
      width: 72px;
      height: 72px;
      border-radius: 36px;
      background: rgba(255, 255, 255, 0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    h1 {
      color: #fff;
      font-size: 22px;
      margin: 0 0 8px;
    }
    p {
      color: rgba(255, 255, 255, 0.85);
      font-size: 15px;
      line-height: 1.5;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <svg width="36" height="36" viewBox="0 0 100 100">
        <polygon points="50,8 61.31,38.69 92,50 61.31,61.31 50,92 38.69,61.31 8,50 38.69,38.69" fill="#fff" />
      </svg>
    </div>
    <h1>Email confirmed</h1>
    <p>Your Find Fun account is verified. Head back to the app and sign in.</p>
  </div>
</body>
</html>`);
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    qwenConfigured: Boolean(HF_TOKEN),
    placesConfigured: Boolean(SERPAPI_KEY),
    authConfigured: Boolean(supabaseAdmin),
    // Bumped whenever a fix needs to be confirmed live without digging
    // through Render's dashboard — compare this against what's expected.
    deployMarker: 'profile-self-heal-v1',
  });
});

app.get('/api/places', paidApiLimiter, requireAuth(), enforceQuota(), async (req, res) => {
  const { location, category, lat, lng } = req.query;

  if (typeof location !== 'string' || !location.trim() || !Object.hasOwn(CATEGORY_QUERIES, category ?? '')) {
    res.status(400).json({ error: 'location (non-empty string) and a valid category are required' });
    return;
  }

  let coords;
  if (lat !== undefined || lng !== undefined) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      res.status(400).json({ error: 'lat and lng must both be valid numbers when provided' });
      return;
    }
    coords = { lat: parsedLat, lng: parsedLng };
  }

  if (!SERPAPI_KEY) {
    res.status(503).json({ error: 'SERPAPI_KEY is not configured on the server' });
    return;
  }

  // Round coords for the cache key so nearby repeat requests (a few meters
  // of GPS drift) still hit cache instead of fragmenting it per-coordinate.
  const locationKey = coords ? `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}` : location.toLowerCase();
  const key = `${locationKey}::${category}`;
  const cached = placesCache.get(key);
  if (cached && cached.expires > Date.now()) {
    res.json({ source: 'google', places: cached.places });
    return;
  }

  try {
    const places = await fetchPlaces(SERPAPI_KEY, location, category, coords);
    placesCache.set(key, { places, expires: Date.now() + PLACES_CACHE_TTL_MS });
    res.json({ source: 'google', places });
  } catch (error) {
    console.error('Places request failed:', error);
    res.status(502).json({ error: 'Failed to fetch places' });
  }
});

app.post('/api/recommendations', paidApiLimiter, requireAuth(), enforceQuota(), async (req, res) => {
  const { location, category, places } = req.body ?? {};

  if (typeof location !== 'string' || typeof category !== 'string' || !Array.isArray(places) || places.length === 0) {
    res.status(400).json({ error: 'location, category, and a non-empty places array are required' });
    return;
  }

  if (!HF_TOKEN) {
    res.status(503).json({ error: 'HF_TOKEN is not configured on the server' });
    return;
  }

  const key = cacheKey(location, category, places);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    res.json({ source: 'qwen', recommendations: cached.recommendations });
    return;
  }

  try {
    const recommendations = await getQwenRecommendations(location, category, places);
    cache.set(key, { recommendations, expires: Date.now() + CACHE_TTL_MS });
    res.json({ source: 'qwen', recommendations });
  } catch (error) {
    console.error('Qwen recommendation request failed:', error);
    res.status(502).json({ error: 'Failed to get recommendations from Qwen' });
  }
});

const MAX_LIKE_IDS_PER_REQUEST = 50;

// Community likes are free/unlimited — no paidApiLimiter or enforceQuota,
// since these don't call SerpApi/Qwen and shouldn't compete with a user's
// monthly search allowance.
app.get('/api/likes', requireAuth(), async (req, res) => {
  const idsParam = req.query.ids;
  if (typeof idsParam !== 'string' || !idsParam.trim()) {
    res.status(400).json({ error: 'ids (comma-separated place IDs) is required' });
    return;
  }

  const ids = [...new Set(idsParam.split(',').map((id) => id.trim()).filter(Boolean))].slice(
    0,
    MAX_LIKE_IDS_PER_REQUEST
  );

  const { data, error } = await supabaseAdmin.from('place_likes').select('place_id, user_id').in('place_id', ids);

  if (error) {
    console.error('Fetching likes failed:', error);
    res.status(500).json({ error: 'Could not load likes' });
    return;
  }

  const likes = Object.fromEntries(ids.map((id) => [id, { count: 0, likedByMe: false }]));
  for (const row of data) {
    likes[row.place_id].count += 1;
    if (row.user_id === req.userId) likes[row.place_id].likedByMe = true;
  }

  res.json({ likes });
});

app.post('/api/places/:placeId/like', requireAuth(), async (req, res) => {
  const { placeId } = req.params;

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('place_likes')
    .select('place_id')
    .eq('user_id', req.userId)
    .eq('place_id', placeId)
    .maybeSingle();

  if (lookupError) {
    console.error('Like lookup failed:', lookupError);
    res.status(500).json({ error: 'Could not update like' });
    return;
  }

  const writeError = existing
    ? (await supabaseAdmin.from('place_likes').delete().eq('user_id', req.userId).eq('place_id', placeId)).error
    : (await supabaseAdmin.from('place_likes').insert({ user_id: req.userId, place_id: placeId })).error;

  if (writeError) {
    console.error('Like write failed:', writeError);
    res.status(500).json({ error: 'Could not update like' });
    return;
  }

  const { count, error: countError } = await supabaseAdmin
    .from('place_likes')
    .select('*', { count: 'exact', head: true })
    .eq('place_id', placeId);

  if (countError) {
    console.error('Like count failed:', countError);
    res.status(500).json({ error: 'Could not update like' });
    return;
  }

  res.json({ liked: !existing, count: count ?? 0 });
});

app.listen(PORT, () => {
  console.log(`Find-Fun recommendations server listening on port ${PORT}`);
});
