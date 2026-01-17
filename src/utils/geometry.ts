// src/utils/geometry.ts

export interface Point {
  lat: number;
  lng: number;
}

/**
 * Decodes Google Maps encoded polyline string into an array of points
 */
export function decodePolyline(encoded: string): Point[] {
  const points: Point[] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

/**
 * Calculates if a point is within 'tolerance' meters of a polyline.
 * Returns the index of the closest segment (to ensure Pickup comes before Dropoff).
 */
export function getPointOnPolylineStatus(point: Point, path: Point[], toleranceMeters: number = 500): { isOnRoute: boolean; index: number } {
  const R = 6371e3; // Earth radius in meters

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    
    const distance = distanceToSegment(point, start, end);
    if (distance <= toleranceMeters) {
      return { isOnRoute: true, index: i };
    }
  }
  return { isOnRoute: false, index: -1 };
}

// Helper: Distance from point P to line segment AB
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const x = p.lat, y = p.lng;
  const x1 = a.lat, y1 = a.lng;
  const x2 = b.lat, y2 = b.lng;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  
  if (len_sq !== 0) param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = x1; yy = y1;
  } else if (param > 1) {
    xx = x2; yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  
  // Approximate conversion to meters (roughly 111km per degree)
  // For production, use Haversine formula here for higher accuracy
  return Math.sqrt(dx * dx + dy * dy) * 111000; 
}