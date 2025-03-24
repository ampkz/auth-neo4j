export class CustomError extends Error {
    _code;
    constructor(message, code, options) {
        super(message, options);
        this._code = code;
    }
    getCode() {
        return this._code;
    }
}
export class InternalError extends CustomError {
    constructor(message, options) {
        super(message, 500, options);
    }
}
export var RoutingErrors;
(function (RoutingErrors) {
    RoutingErrors["INVALID_REQUEST"] = "Invalid Request";
})(RoutingErrors || (RoutingErrors = {}));
export class FieldError {
    static REQUIRED = 'Required';
    static INVALID_AUTH = 'Invalid Auth Type.';
    _field;
    _message;
    constructor(field, message) {
        this._field = field;
        this._message = message;
    }
    getField() {
        return this._field;
    }
    getMessage() {
        return this._message;
    }
    toJSON() {
        return { field: this.getField(), message: this.getMessage() };
    }
}
export class FieldErrors extends CustomError {
    _fieldErrors = [];
    constructor(message, options) {
        super(message, 400, options);
    }
    addFieldError(fieldError) {
        this._fieldErrors.push(fieldError);
    }
    hasFieldErrors() {
        return this._fieldErrors.length > 0;
    }
    getFields() {
        const fields = [];
        for (const fieldError of this._fieldErrors) {
            fields.push(fieldError.toJSON());
        }
        return fields;
    }
}
