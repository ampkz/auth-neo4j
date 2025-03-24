"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
exports.isValidAuth = isValidAuth;
exports.isRoleEscalation = isRoleEscalation;
var Auth;
(function (Auth) {
    Auth["ADMIN"] = "ADMIN";
    Auth["CONTRIBUTOR"] = "CONTRIBUTOR";
    Auth["SELF"] = "SELF";
})(Auth || (exports.Auth = Auth = {}));
function isValidAuth(auth) {
    return Object.values(Auth).includes(auth);
}
function isRoleEscalation(currentAuth, updatedAuth) {
    return currentAuth === Auth.CONTRIBUTOR && updatedAuth === Auth.ADMIN;
}
