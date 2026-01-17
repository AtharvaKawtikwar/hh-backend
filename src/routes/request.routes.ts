import { Router } from "express";
import { requireUser } from "../middleware/requireUser"; // <--- MATCHES YOUR MIDDLEWARE
import {
  createRequestAndFindMatches,
} from "../controllers/request.controller";

const r = Router();

// 1. Create a Request (Triggers the Matching Algorithm)
r.post("/", requireUser, createRequestAndFindMatches);

// 2. List & Cancel (Commented out to prevent crash if not yet in controller)
// r.get("/", requireUser, listMyRequests);
// r.post("/:id/cancel", requireUser, cancelRideRequest);

export default r;