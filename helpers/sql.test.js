'use strict';

const { NotFoundError, BadRequestError, UnauthorizedError } = require('../expressError');
const db = require('../db.js');
const User = require('../models/user.js');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require('../routes/_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** partially change user */

describe(' partial update', function() {
	const updateData = {
		firstName: 'NewF',
		lastName: 'NewF'
	};

	test('works', async function() {
		let job = await User.update('u1', updateData);
		expect(job.firstName).toEqual('NewF');
	});
});
