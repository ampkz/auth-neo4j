export declare enum Auth {
    ADMIN = "ADMIN",
    CONTRIBUTOR = "CONTRIBUTOR",
    SELF = "SELF"
}
export declare function isValidAuth(auth: Auth): boolean;
export declare function isRoleEscalation(currentAuth: Auth, updatedAuth: Auth): boolean;
