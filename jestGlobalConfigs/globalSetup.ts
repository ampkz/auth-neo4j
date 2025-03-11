import dotenv from 'dotenv';
import { initializeDB } from '../src/db/utils';

module.exports = async () => {
	dotenv.config();
	await initializeDB();
};
