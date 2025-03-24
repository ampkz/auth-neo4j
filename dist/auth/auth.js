export var Auth;
(function (Auth) {
    Auth["ADMIN"] = "ADMIN";
    Auth["CONTRIBUTOR"] = "CONTRIBUTOR";
    Auth["SELF"] = "SELF";
})(Auth || (Auth = {}));
export function isValidAuth(auth) {
    return Object.values(Auth).includes(auth);
}
export function isRoleEscalation(currentAuth, updatedAuth) {
    return currentAuth === Auth.CONTRIBUTOR && updatedAuth === Auth.ADMIN;
}
