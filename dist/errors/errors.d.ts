export declare class CustomError extends Error {
    private _code;
    constructor(message: string, code: number, options?: ErrorOptions);
    getCode(): number;
}
export declare class InternalError extends CustomError {
    constructor(message: string, options?: ErrorOptions);
}
export declare enum RoutingErrors {
    INVALID_REQUEST = "Invalid Request"
}
export type FieldErrorJSON = {
    field: string;
    message: string;
};
export declare class FieldError {
    static REQUIRED: string;
    static INVALID_AUTH: string;
    private _field;
    private _message;
    constructor(field: string, message: string);
    getField(): string;
    getMessage(): string;
    toJSON(): FieldErrorJSON;
}
export declare class FieldErrors extends CustomError {
    private _fieldErrors;
    constructor(message: string, options?: ErrorOptions);
    addFieldError(fieldError: FieldError): void;
    hasFieldErrors(): boolean;
    getFields(): Array<FieldErrorJSON>;
}
