// src/services/match.service.ts
import * as reqModel  from "../models/request.model";
import * as userModel from "../models/user.model"; // Import User Model
import { findRequestsNearby } from "./request.service";

const DEFAULT_RADIUS = 5000;

/**
 * For a RIDER: Find nearby available DRIVERS.
 */
export async function getDriverMatchesForRider(requestId: string, radius = DEFAULT_RADIUS) {
  // 1. Get the Rider's request to know their pickup location
  const req = await reqModel.getRequest(requestId); 
  if (!req) return null;

  // 2. Search the USERS collection for drivers near that pickup
  return userModel.findNearbyUsers(
    { lat: req.pickup.lat, lng: req.pickup.lng }, 
    radius, 
    "driver"
  );
}

/**
 * For a DRIVER: Find nearby active RIDE REQUESTS.
 * Drivers provide their current location (lat/lng).
 */
export async function getRiderMatchesForDriver(lat: number, lng: number, radius = DEFAULT_RADIUS) {
  // Search the REQUESTS collection for pickups near the driver
  return findRequestsNearby(lat, lng, radius);
}