import { User } from '../users/user';
export declare function generateSessionToken(bytes?: number): string;
export declare function hashToken(token: string): string;
export interface Session {
    id: string;
    userID: string;
    expiresAt: Date;
}
export type SessionValidationResult = {
    session: Session;
    user: User;
} | {
    session: null;
    user: null;
};
