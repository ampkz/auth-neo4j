import { Request, Response } from 'express';
export declare function sendStatus401(res: Response): Response<any, Record<string, any>>;
export declare function sendStatus405(...allow: string[]): (req: Request, res: Response) => void;
