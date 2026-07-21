import * as Location from 'expo-location';

export interface ResolvedLocation {
  label: string;
  coords: { lat: number; lng: number };
}

/**
 * Requests foreground location permission and resolves the device's current
 * position plus a human-readable label for display. Returns null (never
 * throws) if permission is denied or location can't be determined, so
 * callers can fall back to manual text search instead of crashing.
 */
export async function getCurrentLocation(): Promise<ResolvedLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  try {
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = position.coords;

    let label = 'Current location';
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const resolvedLabel = [place?.city ?? place?.subregion, place?.region].filter(Boolean).join(', ');
      if (resolvedLabel) {
        label = resolvedLabel;
      }
    } catch {
      // Reverse geocoding is best-effort — the coordinates alone are enough
      // to search, so fall back to the generic label rather than failing.
    }

    return { label, coords: { lat: latitude, lng: longitude } };
  } catch {
    return null;
  }
}
