import { destroyDB } from '../src/db/utils';

module.exports = async () => {
	await destroyDB();
};
