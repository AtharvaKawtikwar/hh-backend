// src/controllers/match.controller.ts
import { Request, Response } from "express";
import * as matchSvc from "../services/match.service";

export async function riderMatches(req: Request, res: Response): Promise<void> {
  const { requestId } = req.params;
  const matches = await matchSvc.getDriverMatchesForRider(requestId);
  
  if (matches === null) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  res.json(matches);
}

export async function driverMatches(req: Request, res: Response): Promise<void> {
  // Drivers query based on their current location (lat, lng)
  const { lat, lng } = req.query; 

  if (!lat || !lng) {
    res.status(400).json({ error: "Missing lat/lng query params" });
    return;
  }

  const matches = await matchSvc.getRiderMatchesForDriver(
    Number(lat), 
    Number(lng)
  );
  
  res.json(matches);
}