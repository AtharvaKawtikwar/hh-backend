import { db } from "../config/firebase";

const COLLECTION = "driveOffers";

export interface DriveOfferDoc {
  driverId: string;
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  time: string;
  status: "active" | "booked" | "expired";
  createdAt: any;
}

export async function createDriveOffer(data: DriveOfferDoc) {
  const ref = await db.collection(COLLECTION).add({
    ...data,
    createdAt: new Date().toISOString(),
    status: "active"
  });
  return { id: ref.id, ...data };
}