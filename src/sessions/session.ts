import { User } from '../users/user';

export interface Session {
	id: string;
	userID: string;
	expiresAt: Date;
	host: string;
	userAgent: string;
}

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
