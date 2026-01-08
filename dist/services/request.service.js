"use strict";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
exports.postRequest = postRequest;
exports.fetchRequest = fetchRequest;
exports.fetchAllRequests = fetchAllRequests;
exports.findRequestsNearby = findRequestsNearby;
const requestModel = __importStar(require("../models/request.model"));
const geoutils_1 = require("../utils/geoutils");
async function postRequest(riderId, origin, destination) {
    return requestModel.createRequest({ riderId, origin, destination });
}
async function fetchRequest(requestId) {
    return requestModel.getRequestById(requestId);
}
async function fetchAllRequests() {
    return requestModel.listAllRequests();
}
async function findRequestsNearby(lat, lng, radiusMeters) {
    // 1. Get only ACTIVE requests (Status: REQUESTED)
    const requests = await requestModel.listActiveRequests();
    // 2. Filter by distance (Naive in-memory filter for MVP)
    return requests.filter((r) => {
        if (!r.pickup)
            return false;
        const dist = (0, geoutils_1.getDistance)(r.pickup.lat, r.pickup.lng, lat, lng);
        return dist <= radiusMeters;
    });
}
