import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { faker } from '@faker-js/faker';

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

	test(`${process.env.AUTH_NEO4J_USER_URI} should send 405 status on DELETE with Allow header 'POST' and 'GET'`, async () => {
		await request(app)
			.delete(process.env.AUTH_NEO4J_USER_URI as string)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toContain('POST');
				expect(response.headers.allow).toContain('GET');
			});
	});

	test(`${process.env.AUTH_NEO4J_USER_URI}/:userId should send 405 status on POST with Allow header 'GET', 'DELETE', and 'PUT'`, async () => {
		await request(app)
			.post(`${process.env.AUTH_NEO4J_USER_URI as string}/${faker.database.mongodbObjectId()}`)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toContain('GET');
				expect(response.headers.allow).toContain('DELETE');
				expect(response.headers.allow).toContain('PUT');
			});
	});
});
