"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDriveOffer = createDriveOffer;
const firebase_1 = require("../config/firebase");
const COLLECTION = "driveOffers";
async function createDriveOffer(data) {
    const ref = await firebase_1.db.collection(COLLECTION).add({
        ...data,
        createdAt: new Date().toISOString(),
        status: "active"
    });
    return { id: ref.id, ...data };
}
