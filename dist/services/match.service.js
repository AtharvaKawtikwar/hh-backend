"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverMatchesForRider = getDriverMatchesForRider;
exports.getRiderMatchesForDriver = getRiderMatchesForDriver;
// src/services/match.service.ts
const reqModel = __importStar(require("../models/request.model"));
const userModel = __importStar(require("../models/user.model")); // Import User Model
const request_service_1 = require("./request.service");
const DEFAULT_RADIUS = 5000;
/**
 * For a RIDER: Find nearby available DRIVERS.
 */
async function getDriverMatchesForRider(requestId, radius = DEFAULT_RADIUS) {
    // 1. Get the Rider's request to know their pickup location
    const req = await reqModel.getRequest(requestId);
    if (!req)
        return null;
    // 2. Search the USERS collection for drivers near that pickup
    return userModel.findNearbyUsers({ lat: req.pickup.lat, lng: req.pickup.lng }, radius, "driver");
}
/**
 * For a DRIVER: Find nearby active RIDE REQUESTS.
 * Drivers provide their current location (lat/lng).
 */
async function getRiderMatchesForDriver(lat, lng, radius = DEFAULT_RADIUS) {
    // Search the REQUESTS collection for pickups near the driver
    return (0, request_service_1.findRequestsNearby)(lat, lng, radius);
}
