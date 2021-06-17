'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for companies. */

class Company {
	/** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

	static async create({ handle, name, description, numEmployees, logoUrl }) {
		const duplicateCheck = await db.query(
			`SELECT handle
           FROM companies
           WHERE handle = $1`,
			[ handle ]
		);

		if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate company: ${handle}`);

		const result = await db.query(
			`INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
			[ handle, name, description, numEmployees, logoUrl ]
		);
		const company = result.rows[0];

		return company;
	}

	/** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

	static async findAll() {
		const companiesRes = await db.query(
			`SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`
		);
		return companiesRes.rows;
	}

	/** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

	static async get(handle) {
		const companyRes = await db.query(
			`SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
			[ handle ]
		);

		const company = companyRes.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	static async findFilter(filter) {
		let filtersArray = Object.keys(filter);
		let paramsArray = Object.values(filter);

		let testZip = filtersArray.map(function(key, i) {
			return [ key, paramsArray[i] ];
		});

		//first check mix and max values to make sure min isnt more than max, if so toss requestError
		if (filtersArray.includes('maxEmployees') && filtersArray.includes('minEmployees')) {
			for (let x = 0; x < filtersArray.length; x++) {
				if (testZip[x][0] == 'maxEmployees') {
					for (let i = 0; i < filtersArray.length; i++) {
						if (testZip[i][0] == 'minEmployees') {
							if (parseInt(testZip[i][1]) > parseInt(testZip[x][1])) {
								throw new BadRequestError(`Minimum employees must be less than maximum employees`);
							}
						}
					}
				}
			}
		}

		//make SQL strings for each type of query
		function getSQl() {
			let holder = [];
			for (let x = 0; x < filtersArray.length; x++) {
				if (filtersArray[x] == 'name') {
					if (x > 0) {
						holder.push(` AND LOWER(companies.name) LIKE`);
					} else {
						holder.push(`LOWER(companies.name) LIKE`);
					}
				} else if (filtersArray[x] == 'minEmployees') {
					if (x > 0) {
						holder.push(`AND companies.num_employees > `);
					} else {
						holder.push(`companies.num_employees > `);
					}
				} else if (filtersArray[x] == 'maxEmployees') {
					if (x > 0) {
						holder.push(`AND companies.num_employees <`);
					} else {
						holder.push(`companies.num_employees <`);
					}
				} else throw new BadRequestError(`Improper search phrase: ${filtersArray[x]}`);
			}
			return holder;
		}
		//if name query, take search paramater and ajust SQL text to search for case insensitive LIKES
		for (let x = 0; x < paramsArray.length; x++) {
			if (isNaN(paramsArray[x])) {
				paramsArray[x] = `'%${paramsArray[x].toLowerCase()}%'`;
			}
		}
		//run our SQL function to create array of search types
		let cquilFilters = getSQl();
		//zip together search types and their parameters into array and flatten it so the order goes [search type, parameter, search type, parameter...]. Might not be neccesary though
		const zipper = cquilFilters
			.map(function(key, i) {
				return [ key, paramsArray[i] ];
			})
			.flat();

		// Join the zipper together into one string to add to SQL query
		let q = zipper.join(' ');
		console.log(q);

		const companyRes = await db.query(
			`SELECT handle,
		            name,
		            description,
		            num_employees AS "numEmployees",
		            logo_url AS "logoUrl"
		     FROM companies
		     WHERE ${q} `
		);

		return companyRes.rows;
	}

	/** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

	static async update(handle, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			numEmployees: 'num_employees',
			logoUrl: 'logo_url'
		});
		const handleVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
		const result = await db.query(querySql, [ ...values, handle ]);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	/** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

	static async remove(handle) {
		const result = await db.query(
			`DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
			[ handle ]
		);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);
	}
}

module.exports = Company;
