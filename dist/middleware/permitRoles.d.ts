import { NextFunction, Request, Response } from 'express';
import { Auth } from '../auth/auth';
export declare function permitRoles(...rolesPermitted: Array<Auth>): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
