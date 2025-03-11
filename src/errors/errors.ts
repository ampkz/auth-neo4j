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
