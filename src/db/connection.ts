import neo4j, { Driver } from 'neo4j-driver';
import { InternalError } from '../errors/errors';

export enum Errors {
	DB_CONNECTION_UNAUTHORIZED = 'Unauthorized Connection to Driver',
}

export async function connect(
	username: string = process.env.AUTH_NEO4J_NEO4J_USER as string,
	password: string = process.env.AUTH_NEO4J_NEO4J_PWD as string
): Promise<Driver> {
	const driver: Driver = neo4j.driver(
		`bolt://${process.env.AUTH_NEO4J_NEO4J_HOST}:${process.env.AUTH_NEO4J_NEO4J_PORT}`,
		neo4j.auth.basic(username, password)
	);

	try {
		// Will throw an error if not authenticated
		await driver.getServerInfo();
	} catch (error) {
		throw new InternalError(Errors.DB_CONNECTION_UNAUTHORIZED, { cause: error });
	}

	return driver;
}
