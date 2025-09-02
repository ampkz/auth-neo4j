export class CustomError extends Error {
	private _code: number;

	constructor(message: string, code: number, options?: ErrorOptions) {
		super(message, options);

		this._code = code;
	}

	getCode(): number {
		return this._code;
	}
}

export class InternalError extends CustomError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, 500, options);
	}
}

export enum RoutingErrors {
	INVALID_REQUEST = 'Invalid Request',
}

export type FieldErrorJSON = { field: string; message: string; validationErrors?: ValidationError[] };

type ValidationError = {
	validation: string;
	message: string;
};

export class FieldError {
	static REQUIRED: string = 'Required';
	static INVALID_AUTH = 'Invalid Auth Type.';
	static INVALID_PASSWORD = 'Invalid Password.';

	private _field: string;
	private _message: string;
	private _validationErrors: Array<ValidationError> = [];

	constructor(field: string, message: string, validationErrors: Array<ValidationError> = []) {
		this._field = field;
		this._message = message;
		this._validationErrors = validationErrors;
	}

	getField(): string {
		return this._field;
	}

	getMessage(): string {
		return this._message;
	}

	toJSON(): FieldErrorJSON {
		if (this._validationErrors.length > 0) {
			return { field: this.getField(), message: this.getMessage(), validationErrors: this._validationErrors };
		} else {
			return { field: this.getField(), message: this.getMessage() };
		}
	}
}

export class FieldErrors extends CustomError {
	private _fieldErrors: Array<FieldError> = [];

	constructor(message: string, options?: ErrorOptions) {
		super(message, 400, options);
	}

	addFieldError(fieldError: FieldError) {
		this._fieldErrors.push(fieldError);
	}

	hasFieldErrors(): boolean {
		return this._fieldErrors.length > 0;
	}

	getFields(): Array<FieldErrorJSON> {
		const fields: Array<FieldErrorJSON> = [];
		for (const fieldError of this._fieldErrors) {
			fields.push(fieldError.toJSON());
		}
		return fields;
	}
}
