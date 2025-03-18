import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';

describe(`Auth Route Tests`, () => {
	let app: Express;

	beforeAll(async () => {
		app = await authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${process.env.AUTH_NEO4J_USER_URI} should send 405 status on PUT with Allow header 'POST' and 'GET'`, async () => {
		await request(app)
			.put(process.env.AUTH_NEO4J_USER_URI as string)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toContain('POST');
				expect(response.headers.allow).toContain('GET');
			});
	});
});
