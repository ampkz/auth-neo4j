import { Express } from 'express';
import authNeo4j from '../../../src';
import request from 'supertest';
import { faker } from '@faker-js/faker';

import Config from '../../../src/config/config';

describe(`405 Route Tests`, () => {
	let app: Express;

	beforeAll(async () => {
		app = await authNeo4j();
	});

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test(`${Config.USER_URI} should send 405 status on PUT with Allow header 'POST' and 'GET'`, async () => {
		await request(app)
			.put(Config.USER_URI)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toContain('POST');
				expect(response.headers.allow).toContain('GET');
			});
	});

	test(`${Config.USER_URI} should send 405 status on DELETE with Allow header 'POST' and 'GET'`, async () => {
		await request(app)
			.delete(Config.USER_URI)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toContain('POST');
				expect(response.headers.allow).toContain('GET');
			});
	});

	test(`${Config.USER_URI}/:userId should send 405 status on POST with Allow header 'GET', 'DELETE', and 'PUT'`, async () => {
		await request(app)
			.post(`${Config.USER_URI}/${faker.database.mongodbObjectId()}`)
			.expect(405)
			.then(response => {
				expect(response.headers.allow).toContain('GET');
				expect(response.headers.allow).toContain('DELETE');
				expect(response.headers.allow).toContain('PUT');
			});
	});
});
