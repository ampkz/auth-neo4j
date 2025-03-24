export declare enum ErrorMsgs {
    COULD_NOT_CREATE_DB = "Could Not Create Database",
    COULD_NOT_CREATE_CONSTRAINT = "Could Not Create Constraint",
    CONSTRAINT_ALREADY_EXISTS = "Constrain Already Exists"
}
export declare function initializeDB(): Promise<boolean>;
export declare function destroyDB(): Promise<boolean>;
