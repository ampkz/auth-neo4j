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

export type FieldErrorJSON = { field: string; message: string };

export class FieldError {
	static REQUIRED: string = 'Required';

	private _field: string;
	private _message: string;

	constructor(field: string, message: string) {
		this._field = field;
		this._message = message;
	}

	getField(): string {
		return this._field;
	}

	getMessage(): string {
		return this._message;
	}

	toJSON(): FieldErrorJSON {
		return { field: this.getField(), message: this.getMessage() };
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
