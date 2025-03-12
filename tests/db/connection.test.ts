import { Driver, ServerInfo } from 'neo4j-driver';
import { connect, Errors as DBErrors } from '../../src/db/connection';

describe(`DB Connection Tests`, () => {
	it(`should connecto to the DB`, async () => {
		const driver: Driver = await connect();
		const serverInfo: ServerInfo = await driver.getServerInfo();
		await driver.close();
		expect(serverInfo.address).toEqual(`${process.env.AUTH_NEO4J_NEO4J_HOST}:${process.env.AUTH_NEO4J_NEO4J_PORT}`);
	});

	it(`should throw an error with incorrect credentials`, async () => {
		await expect(connect('nouser', 'pwd')).rejects.toThrow(DBErrors.DB_CONNECTION_UNAUTHORIZED);
	});
});
