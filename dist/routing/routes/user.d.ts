import { Request, Response } from 'express';
export declare function getUsers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
