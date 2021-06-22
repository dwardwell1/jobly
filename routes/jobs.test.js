'use strict';

const request = require('supertest');

const db = require('../db.js');
const app = require('../app');
const User = require('../models/user');
const Job = require('../models/job');

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	a1Token
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe('POST /jobs', function() {
	test('works for admins: job', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title: 'little stinker',
				salary: 100000,
				equity: 0,
				company_handle: 'c1'
			})
			.set('authorization', `Bearer ${a1Token}`);
		expect(resp.statusCode).toEqual(201);
		let id = resp.body.job.id;
		expect(resp.body).toEqual({
			job: {
				id: id,
				title: 'little stinker',
				salary: 100000,
				equity: '0',
				companyHandle: 'c1'
			}
		});
	});

	test('doenst work for non admins: job', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title: 'little stinker',
				salary: 100000,
				equity: 0,
				company_handle: 'c1'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});
});

test('bad request if missing data', async function() {
	const resp = await request(app)
		.post('/jobs')
		.send({
			title: 'u-new'
		})
		.set('authorization', `Bearer ${a1Token}`);
	expect(resp.statusCode).toEqual(400);
});

test('bad request if invalid data', async function() {
	const resp = await request(app)
		.post('/jobs')
		.send({
			title: 'little stinker',
			salary: 'shit',
			equity: '0',
			companyHandle: 'c1'
		})
		.set('authorization', `Bearer ${a1Token}`);
	expect(resp.statusCode).toEqual(400);
});

/************************************** GET /jobs */

describe('GET /jobs', function() {
	test('works for everyone ', async function() {
		const resp = await request(app).get('/jobs');

		expect(resp.statusCode).toEqual(200);
		expect(resp.body.jobs.length).toEqual(1);
	});
});

// /************************************** GET /jobs/:id */

describe('GET /jobs/:id', function() {
	test('works for all', async function() {
		const idone = await db.query(`SELECT id FROM jobs WHERE company_handle = 'c1' `);
		let id = idone.rows[0].id;

		const resp = await request(app).get(`/jobs/${id}`);
		expect(resp.body).toEqual({
			job: {
				id: id,
				title: 'Conservator, furniture',
				salary: 110000,
				equity: '0',
				companyHandle: 'c1'
			}
		});
	});

	test('not found if job not found', async function() {
		const resp = await request(app).get(`/jobs/999999`);
		expect(resp.statusCode).toEqual(404);
	});
});

// /************************************** PATCH /users/:username */

describe('PATCH /jobs/:id', () => {
	test('works for admins', async function() {
		const idone = await db.query(`SELECT id FROM jobs WHERE company_handle = 'c1' `);
		let id = idone.rows[0].id;

		const resp = await request(app)
			.patch(`/jobs/${id}`)
			.send({
				salary: 9
			})
			.set('authorization', `Bearer ${a1Token}`);
		expect(resp.body).toEqual({
			job: {
				id: id,
				title: 'Conservator, furniture',
				salary: 9,
				equity: '0',
				companyHandle: 'c1'
			}
		});
	});

	test('unauth for user/anon', async function() {
		const idone = await db.query(`SELECT id FROM jobs WHERE company_handle = 'c1' `);
		let id = idone.rows[0].id;

		const resp = await request(app)
			.patch(`/jobs/${id}`)
			.send({
				salary: 5000000
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found if no such job', async function() {
		const resp = await request(app)
			.patch(`/jobs/999999999`)
			.send({
				salary: 100
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request if invalid data', async function() {
		const idone = await db.query(`SELECT id FROM jobs WHERE company_handle = 'c1' `);
		let id = idone.rows[0].id;
		const resp = await request(app)
			.patch(`/users/${id}`)
			.send({
				salary: 'potatoes'
			})
			.set('authorization', `Bearer ${a1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

// /************************************** DELETE /users/:username */

describe('DELETE /users/:username', function() {
	test('works for admins', async function() {
		const idone = await db.query(`SELECT id FROM jobs WHERE company_handle = 'c1' `);
		let id = idone.rows[0].id;
		const resp = await request(app).delete(`/jobs/${id}`).set('authorization', `Bearer ${a1Token}`);
		expect(resp.body).toEqual({ deleted: `${id}` });
	});

	test('unauth for non admins', async function() {
		const idone = await db.query(`SELECT id FROM jobs WHERE company_handle = 'c1' `);
		let id = idone.rows[0].id;
		const resp = await request(app).delete(`/jobs/${id}`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found if job missing', async function() {
		const resp = await request(app).delete(`/users/9999999999`).set('authorization', `Bearer ${a1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});
