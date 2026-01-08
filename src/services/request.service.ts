// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import * as requestModel from "../models/request.model";
import { getDistance } from "../utils/geoutils";

export async function postRequest(
  riderId: string,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
) {
  return requestModel.createRequest({ riderId, origin, destination });
}

export async function fetchRequest(requestId: string) {
  return requestModel.getRequestById(requestId);
}

export async function fetchAllRequests() {
  return requestModel.listAllRequests();
}

export async function findRequestsNearby(
  lat: number,
  lng: number,
  radiusMeters: number
) {
  // 1. Get only ACTIVE requests (Status: REQUESTED)
  const requests = await requestModel.listActiveRequests();

  // 2. Filter by distance (Naive in-memory filter for MVP)
  return requests.filter((r) => {
    if (!r.pickup) return false;
    const dist = getDistance(r.pickup.lat, r.pickup.lng, lat, lng);
    return dist <= radiusMeters;
  });
}
