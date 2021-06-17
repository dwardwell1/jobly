const { BadRequestError } = require('../expressError');

// THIS NEEDS SOME GREAT DOCUMENTATION.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	// Create an object of the keys provided in the API request
	const keys = Object.keys(dataToUpdate);
	//if no keys were provided throw error
	if (keys.length === 0) throw new BadRequestError('No data');
	// Create the dollar sign values for our SQL injection text
	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`);
	//return a SQL appropriate string of our data to update to make SQL query
	return {
		setCols: cols.join(', '),
		values: Object.values(dataToUpdate)
	};
}

module.exports = { sqlForPartialUpdate };
