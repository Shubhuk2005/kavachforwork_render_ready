import { canonicalizeState } from './pricing.js';

export async function getCurrentCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not available on this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      (error) => reject(new Error(error.message || 'Unable to read your location.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export async function reverseGeocodeIndia(latitude, longitude) {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}` +
    `&longitude=${longitude}&localityLanguage=en`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Location API lookup failed.');
  }

  const data = await response.json();
  const detectedState = canonicalizeState(
    data.principalSubdivision ||
      data.localityInfo?.administrative?.find((item) => item.order === 4)?.name ||
      ''
  );

  return {
    city: data.city || data.locality || data.localityInfo?.administrative?.[1]?.name || '',
    state: detectedState,
    countryCode: data.countryCode || '',
    formatted: [data.locality, detectedState].filter(Boolean).join(', '),
  };
}

export function statesMatch(selectedState, detectedState) {
  return canonicalizeState(selectedState) === canonicalizeState(detectedState);
}
