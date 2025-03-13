"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomId = generateRandomId;
function generateRandomId(name) {
    const timestamp = Date.now().toString(36); // Base-36 timestamp
    const randomPart = Math.random().toString(36).substring(2, 8); // Random 6 chars
    if (name.length > 9) {
        return `${name}-${timestamp}`;
    }
    return `${name}-${timestamp}-${randomPart}`;
}
