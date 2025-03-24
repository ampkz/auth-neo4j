import { Driver } from 'neo4j-driver';
export declare enum Errors {
    DB_CONNECTION_UNAUTHORIZED = "Unauthorized Connection to Driver"
}
export declare function connect(username?: string, password?: string): Promise<Driver>;
