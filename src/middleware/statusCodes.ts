import { Request, Response } from 'express';

import Config from '../config/config';

export function sendStatus401(res: Response) {
	return res.set('WWW-Authenticate', `xBasic realm="${Config.AUTH_REALM}"`).status(401).end();
}

export function sendStatus405(...allow: string[]) {
	return (req: Request, res: Response) => {
		res.set('Allow', allow).status(405).end();
	};
}
