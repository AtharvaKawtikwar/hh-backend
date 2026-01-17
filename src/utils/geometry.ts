import * as geolib from "geolib";

export function decodePolyline(encoded: string) {
  if (!encoded) return [];
  
  // Basic polyline decoding algorithm (Google Maps format)
  let index = 0, lat = 0, lng = 0;
  const coordinates = [];
  const len = encoded.length;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return coordinates;
}

// UPDATE: Added 'distance' to the return type definition
export function getPointOnPolylineStatus(
  point: { lat: number; lng: number }, 
  path: { lat: number; lng: number }[], 
  toleranceMeters: number
): { isOnRoute: boolean; index: number; distance: number } {
  
  let minDistance = Infinity;
  let closestIndex = -1;

  // Simple checks to optimize performance
  if (!path || path.length === 0) {
      return { isOnRoute: false, index: -1, distance: Infinity };
  }

  // Iterate through every point on the path to find the closest one
  // (For production, we would use a spatial index, but this is fine for now)
  path.forEach((p, idx) => {
    const dist = geolib.getDistance(point, p);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = idx;
    }
  });

  return {
    isOnRoute: minDistance <= toleranceMeters,
    index: closestIndex,
    distance: minDistance // <--- Now returning the calculated distance
  };
}