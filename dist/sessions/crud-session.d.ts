import { Session, SessionValidationResult } from './session';
export declare enum Errors {
    COULD_NOT_CREATE_SESSION = "There was an error creating a session",
    COULD_NOT_VALIDATE_SESSION = "There was an error validating a session",
    COULD_NOT_INVALIDATE_SESSION = "There was an error invalidating a session",
    COULD_NOT_INVALIDATE_ALL_SESSIONS = "There was an error invalidating all sessions"
}
export declare function createSession(token: string, email: string): Promise<Session | undefined>;
export declare function validateSessionToken(token?: string): Promise<SessionValidationResult>;
export declare function invalidateSession(sessionId: string): Promise<void>;
export declare function invalidateAllSessions(email: string): Promise<void>;
