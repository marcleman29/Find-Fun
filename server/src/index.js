import express from 'express';
import cors from 'cors';

const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_BASE_URL = process.env.QWEN_BASE_URL ?? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const QWEN_MODEL = process.env.QWEN_MODEL ?? 'qwen-plus';
const PORT = process.env.PORT ?? 3000;

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map();

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
        'Respond with ONLY a JSON object: ' +
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

async function getQwenRecommendations(location, category, places) {
  const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages: buildMessages(location, category, places),
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qwen API error ${response.status}: ${errorText}`);
  }

  const completion = await response.json();
  const content = completion.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed.recommendations)) {
    throw new Error('Qwen response did not include a recommendations array');
  }

  const validIds = new Set(places.map((place) => place.id));
  const recommendations = parsed.recommendations.filter(
    (rec) => rec && validIds.has(rec.id) && typeof rec.score === 'number'
  );

  if (recommendations.length === 0) {
    throw new Error('Qwen response contained no recommendations matching the request');
  }

  return recommendations;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, qwenConfigured: Boolean(QWEN_API_KEY) });
});

app.post('/api/recommendations', async (req, res) => {
  const { location, category, places } = req.body ?? {};

  if (typeof location !== 'string' || typeof category !== 'string' || !Array.isArray(places) || places.length === 0) {
    res.status(400).json({ error: 'location, category, and a non-empty places array are required' });
    return;
  }

  if (!QWEN_API_KEY) {
    res.status(503).json({ error: 'QWEN_API_KEY is not configured on the server' });
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

app.listen(PORT, () => {
  console.log(`Find-Fun recommendations server listening on port ${PORT}`);
});
