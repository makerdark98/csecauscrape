// Logger Configure
let winston = require('winston');
exports.logger = function(logfilename){
    return new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                timestamp: true
            }),
            new (winston.transports.File)({
                timestamp: 'true',
                filename: logfilename
            })
        ]
    });
};
