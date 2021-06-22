'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job.js');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create job*/

describe('makeJob', function() {
	const newJob = {
		title: 'big time tester',
		salary: 420,
		equity: 0,
		company_handle: 'c1'
	};

	test('works', async function() {
		let job = await Job.create({
			...newJob
		});
		// expect(job).toEqual(newJob);
		let jobId = job.id;
		const found = await db.query(`SELECT * FROM jobs WHERE id = ${jobId}`);
		expect(found.rows.length).toEqual(1);
	});

	test('bad request with wrong company handle', async function() {
		try {
			let job = await Job.create({
				title: 'big time tester',
				salary: 420,
				equity: 0,
				company_handle: 'wrong'
			});
			console.log('!!!!', job);
			fail();
		} catch (err) {
			expect(err).toBeTruthy();
		}
		expect();
	});
});

/************************************** edit job*/
describe('update', function() {
	const updateData = {
		title: 'NEW big time tester',
		salary: 520,
		equity: 0,
		company_handle: 'c2'
	};

	test('works', async function() {
		let job = await Job.update(1, updateData);

		expect(job).toEqual({
			id: 1,
			title: 'NEW big time tester',
			salary: 520,
			equity: '0',
			companyHandle: 'c2'
		});
	});
	/************************************** delete job*/

	describe('remove', function() {
		test('works', async function() {
			await Job.remove('1');
			const res = await db.query("SELECT * FROM jobs WHERE id='1'");
			expect(res.rows.length).toEqual(0);
		});

		test('not found if no such job', async function() {
			try {
				await Job.remove('9999');
				fail();
			} catch (err) {
				expect(err instanceof NotFoundError).toBeTruthy();
			}
		});
	});
});
