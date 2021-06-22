'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for companies. */

class Job {
	/** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, company_handle}
   *
   * Throws BadRequestError if job already in database or company doesnt exist.
   * */

	static async create({ title, salary, equity, company_handle }) {
		const duplicateCheck = await db.query(
			`SELECT title, company_handle
           FROM jobs
           WHERE title = $1 AND company_handle = $2 `,
			[ title, company_handle ]
		);

		if (duplicateCheck.rows[0]) throw new BadRequestError(`Job already exisits: ${title} with ${company_handle}`);

		const result = await db.query(
			`INSERT INTO jobs
           ( title, salary, equity, company_handle )
           VALUES ($1, $2, $3, $4)
           RETURNING  id,title, salary, equity, company_handle  AS "companyHandle"`,
			[ title, salary, equity, company_handle ]
		);
		const job = result.rows[0];

		return job;
	}

	/** Find all jobs.
   *
   * Returns [{title, salary, equity, company_handle}, ...]
   * */

	static async findAll() {
		const jobRes = await db.query(
			`SELECT id,title, salary, equity, company_handle  AS "companyHandle"
           FROM jobs
           ORDER BY id`
		);
		return jobRes.rows;
	}

	/** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle },
   *   where company is { handle, name, description, numEmployees, logoUrl, jobs }
   *
   * Throws NotFoundError if not found.
   **/

	static async get(id) {
		const jobRes = await db.query(
			`SELECT id,title, salary, equity, company_handle  AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
			[ id ]
		);

		const job = jobRes.rows[0];

		if (!job) throw new NotFoundError(`No job ID: ${id}`);

		return job;
	}
	//get by company
	static async getCompany(handle) {
		const jobRes = await db.query(
			`SELECT id,title, salary, equity, company_handle  AS "companyHandle"
           FROM jobs
           WHERE company_handle  = $1`,
			[ handle ]
		);

		const jobs = jobRes.rows;

		if (!jobs) throw new NotFoundError(`No listed jobs: ${handle}`);

		return jobs;
	}

	static async findFilter(filter) {
		//make function to create SQL string

		let holding = [];
		function equitySQL() {
			if ('hasEquity' in filter) {
				if (filter.hasEquity == true) holding.push(`jobs.equity > 0`);
			}
		}
		function titleSQL() {
			if ('title' in filter) {
				filter.title = `'%${filter.title.toLowerCase()}%'`;
				holding.push(`LOWER(jobs.title) LIKE ${filter.title}`);
			}
		}
		function minSalarySQL() {
			if ('minSalary' in filter) {
				holding.push(`jobs.salary >= ${filter.minSalary}`);
			}
		}
		equitySQL();
		titleSQL();
		minSalarySQL();
		let finalQuery = holding.join(' AND ');

		const jobRes = await db.query(
			`SELECT id,title, salary, equity, company_handle  AS "companyHandle"
            FROM jobs
		     WHERE ${finalQuery} `
		);

		return jobRes.rows;
	}

	/** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {SELECT id,title, salary, equity, company_handle  AS "companyHandle"
           FROM jobs}
   *
   * Throws NotFoundError if not found.
   */

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			numEmployees: 'num_employees',
			logoUrl: 'logo_url'
		});
		const idVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING  id, title, salary, equity, company_handle  AS "companyHandle"`;
		const result = await db.query(querySql, [ ...values, id ]);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job id: ${id}`);

		return job;
	}

	/** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

	static async remove(id) {
		const result = await db.query(
			`DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
			[ id ]
		);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job: ${id}`);
	}
}

module.exports = Job;
