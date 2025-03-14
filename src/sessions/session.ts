import crypto from 'node:crypto';
import { User } from '../users/user';

export function generateSessionToken(bytes: number = 32): string {
	return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}

export interface Session {
	id: string;
	userID: string;
	expiresAt: Date;
}

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
