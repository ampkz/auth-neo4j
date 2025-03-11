import { CustomError, InternalError } from '../../errors/errors';

describe(`Errors Tests`, () => {
	it(`should create a custom error with a code`, () => {
		const message: string = 'Error Message';
		const code: number = 100;
		const error: CustomError = new CustomError(message, code);

		expect(error.message).toEqual(message);
		expect(error.getCode()).toEqual(code);
	});

	it(`should create an internal error with code 500`, () => {
		const message: string = 'Internal Error';

		const internalError: InternalError = new InternalError(message);

		expect(internalError.message).toEqual(message);
		expect(internalError.getCode()).toEqual(500);
	});
});
