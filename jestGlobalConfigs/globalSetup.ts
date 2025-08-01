import { initializeDB } from '../src/db/utils';

module.exports = async () => {
	await initializeDB();
};
