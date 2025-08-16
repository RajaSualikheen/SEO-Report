import winston from 'winston';

const logger = winston;

logger.configure({
    transports: [
        new logger.transports.Console({
            format: logger.format.simple()
        })
    ]
});

logger.level = 'debug';

export default logger;