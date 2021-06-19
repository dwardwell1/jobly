'use strict';

/** Routes for jobs. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError } = require('../expressError');
const { ensureLoggedIn, ensureAdmin } = require('../middleware/auth');
const Job = require('../models/job');

const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobUpdate.json');

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

router.post('/', ensureAdmin, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, jobNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}
		console.log('!!!!!!', req.body);
		const job = await Job.create(req.body);
		return res.status(201).json({ job });
	} catch (err) {
		return next(err);
	}
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */
// <--need to fix equity!
router.get('/', async function(req, res, next) {
	try {
		let jobs = await Job.findAll();
		// to implement search query function we check for keys in response body. Must be an easier way though. However just checking req body alone doesnt work
		if (Object.keys(req.body).length > 0) {
			jobs = await Job.findFilter(req.body);
		}
		return res.json({ jobs });
	} catch (err) {
		return next(err);
	}
});

// /** GET /[id]  =>  { job }
//  *
//  *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
//  *   where jobs is [{ id, title, salary, equity }, ...]
//  *
//  * Authorization required: none
//  */

router.get('/:id', async function(req, res, next) {
	try {
		const job = await Job.get(req.params.id);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

// /** PATCH /[handle] { fld1, fld2, ... } => { company }
//  *
//  * Patches company data.
//  *
//  * fields can be: { name, description, numEmployees, logo_url }
//  *
//  * Returns { handle, name, description, numEmployees, logo_url }
//  *
//  * Authorization required: login
//  */

router.patch('/:id', ensureAdmin, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, jobUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const job = await Job.update(req.params.handle, req.body);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

// /** DELETE /[handle]  =>  { deleted: handle }
//  *
//  * Authorization: login
//  */

// router.delete('/:handle', ensureAdmin, async function(req, res, next) {
// 	try {
// 		await Company.remove(req.params.handle);
// 		return res.json({ deleted: req.params.handle });
// 	} catch (err) {
// 		return next(err);
// 	}
// });

module.exports = router;
