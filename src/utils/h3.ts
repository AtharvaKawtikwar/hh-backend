import h3 from "h3-js";
import { decodePolyline } from "./geometry"; // We reuse your existing decoder

// Resolution 7 = Hexagon edge is ~1.2 km. 
// Good balance between "too precise" and "too broad".
const H3_RESOLUTION = 7;

export function getRouteCells(overview_polyline: string): string[] {
  // 1. Decode Google Polyline -> Array of {lat, lng}
  const path = decodePolyline(overview_polyline);
  
  const cells = new Set<string>();

  // 2. Convert every point to a Hexagon ID
  path.forEach(point => {
    // h3.latLngToCell(lat, lng, resolution)
    const cellId = h3.latLngToCell(point.lat, point.lng, H3_RESOLUTION);
    cells.add(cellId);
  });

  // 3. Fill the gaps (Interpolation)
  // Sometimes points are far apart. We need to connect the hexagons so there are no holes.
  // Note: For a simple MVP, just point conversion is often enough if the polyline is detailed.
  // But strictly speaking, we just return the unique set for now.
  
  return Array.from(cells);
}

export function getLocationCell(lat: number, lng: number): string {
    return h3.latLngToCell(lat, lng, H3_RESOLUTION);
}

// Get the cell AND its neighbors (for "nearby" search)
export function getNearbyCells(lat: number, lng: number): string[] {
    const centerCell = h3.latLngToCell(lat, lng, H3_RESOLUTION);
    // kRing(center, 1) returns the center + 6 surrounding hexagons
    return h3.gridDisk(centerCell, 1);
}