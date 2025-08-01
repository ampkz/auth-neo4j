import neo4j, { Driver } from 'neo4j-driver';
import { InternalError } from '../errors/errors';

import Config from '../config/config';

export enum Errors {
	DB_CONNECTION_UNAUTHORIZED = 'Unauthorized Connection to Driver',
}

export async function connect(username: string = Config.NEO4J_USER, password: string = Config.NEO4J_PWD): Promise<Driver> {
	const driver: Driver = neo4j.driver(`bolt://${Config.NEO4J_HOST}:${Config.NEO4J_PORT}`, neo4j.auth.basic(username, password));

	try {
		// Will throw an error if not authenticated
		await driver.getServerInfo();
	} catch (error) {
		throw new InternalError(Errors.DB_CONNECTION_UNAUTHORIZED, { cause: error });
	}

	return driver;
}
