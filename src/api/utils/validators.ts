import PasswordValidator from 'password-validator';

export const isValidPassword = (password: string): any[] => {
	const schema = new PasswordValidator();
	schema
		.is()
		.min(6) // Minimum length 6
		.is()
		.max(100) // Maximum length 100
		.has()
		.uppercase() // Must have uppercase letters
		.has()
		.lowercase() // Must have lowercase letters
		.has()
		.digits() // Must have digits
		.has()
		.not()
		.spaces(); // Should not have spaces
	return schema.validate(password, { details: true }) as any[];
};
