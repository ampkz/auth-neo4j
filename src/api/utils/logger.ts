import { createLogger, transports, format } from 'winston';

const logger = createLogger({
	level: 'info',
	format: format.combine(format.timestamp(), format.simple(), format.colorize(), format.errors({ stack: true })),
	transports: [new transports.Console()],
	exceptionHandlers: [new transports.Console()],
});

export default logger;
