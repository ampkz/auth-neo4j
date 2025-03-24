import crypto from 'node:crypto';
export function generateSessionToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}
export function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
