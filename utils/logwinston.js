// utils/logwinston.js
// Print the log to a file in a formatted way.
// 
// All rights reserved. Modelo, Inc xx - 2016
//
  
//import  
var fs      = require('fs');  
var util    = require('util');  
var path = require('path');
var winston = require('winston'); 
var mkdirp  = require('mkdirp');  
var system  = require('./system');
winston.transports.DailyRotateFile = require('winston-daily-rotate-file'); 

var logPath = path.join(system.getProjectRoot(), "logs");

if (!fs.existsSync(logPath)) {  
    mkdirp.sync(logPath);  
};  

var myLoggerWinston = {
    createLogger : null,
    start : null,
    appLog : null
};
 
myLoggerWinston.createLogger = function createLogger(fileName) {  
    var logger = new (winston.Logger)({  
        transports: [  
          new (winston.transports.DailyRotateFile)({   
            filename: path.join(logPath, fileName),  
            datePattern: '-yyyy-MM-dd.txt',  //switch file daily
            maxsize: 1024 * 1024 * 50, // 50MB   
            json:false
          })  
        ]  
    });  
    return logger;  
}  
  
myLoggerWinston.start = function start(){   
    myLoggerWinston.appLog = myLoggerWinston.createLogger('cvt-server');  
};  

myLoggerWinston.info = function info() {
    myLoggerWinston.appLog.info.apply(this, arguments);
};

myLoggerWinston.warn = function warn() {
    myLoggerWinston.appLog.warn.apply(this, arguments);
};

myLoggerWinston.error = function error() {
    myLoggerWinston.appLog.error.apply(this, arguments);
};

myLoggerWinston.time = function time(message) {
    myLoggerWinston.appLog.profile(message);
};

myLoggerWinston.timeEnd = function timeEnd(message) {
    myLoggerWinston.appLog.profile(message);
};

module.exports = myLoggerWinston;  
