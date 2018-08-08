// utils/log.js
// Print the log to a file in a formatted way.
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var fs         = require('fs');
var moment     = require("moment");
var configs    = require("../global").config();
var system     = require('./system');
var path       = require("path");

var isDebug = false;
 
 
var myLogger = {
    start: null,
    finish: null,
    //stream: null,
    logwinston: null,
    console:    null,
    OTHER:      "Main     ",
    HTTP:       "HTTP     ",
    AMQP:       "AMQP     ",
    CONVERT:    "Converter",
    RENDER:     "Render   ",
    S3:         "S3       ",
    SCHEDULER:  "Scheduler"
};

// Prepare a log file
myLogger.start = function start(useTerminal) {
    var date = moment();
    var file = date.format("YYYY-MM-DD") + ".txt";
    var filepath = path.join(system.getProjectRoot(), "logs", 'render-server-' + file);

    //myLogger.stream = fs.createWriteStream(filepath);

    console.log("Log to file: " + filepath);
    
    if (useTerminal) {
        myLogger.console = console;
        isDebug = true;
    } else {
        myLogger.logwinston = require('./logwinston');
        myLogger.logwinston.start();
        myLogger.console = myLogger.logwinston;
        isDebug = false;
    }
};

// never will be called
myLogger.restart = function restart() {
    var date = moment();

    // delete old logs one week ago
    system.listFiles(path.join(system.getProjectRoot(), "logs"))
        .then(function(filepaths) {
            for (var i = 0, len = filepaths.length; i < len; i++) {
                if (path.extname(filepaths[i]) === ".txt") {
                    var oldDate = moment(path.basename(filepaths[i]).substring(0, 6), "YYMMDD");
                    if (date.diff(oldDate, 'days') > 7) {
                        fs.unlinkSync(filepaths[i]);
                    }
                }
            }

            // reset the log stream
            var file = date.format("YYMMDD_HHmm") + ".txt";
            var filepath = path.join(system.getProjectRoot(), "logs", file);

            // close previous log steeam
            myLogger.stream.end();
            myLogger.stream = null;

            myLogger.stream = fs.createWriteStream(filepath);

            console.log("Log to file: " + filepath);
            myLogger.console = new console.Console(myLogger.stream);

            setTimeout(myLogger.restart, 1000 * 3600 * 24);
        });
};

myLogger.finish = function finish() {
    myLogger.console = console;
};

myLogger.info = function info() {
    var args = Array.prototype.slice.call(arguments, 1);
    args[0] = moment().format("HH:mm:ss") + " " + arguments[0] + " | " + args[0];

    myLogger.console.info.apply(this, args);
};

myLogger.warn = function warn() {
    var args = Array.prototype.slice.call(arguments, 1);
    args[0] = moment().format("HH:mm:ss") + " " + arguments[0] + " | " + args[0];

    myLogger.console.warn.apply(this, args);
};

myLogger.error = function error() {
    var args = Array.prototype.slice.call(arguments, 1);
    args[0] = moment().format("HH:mm:ss") + " " + arguments[0] + " | " + args[0];

    myLogger.console.error.apply(this, args);
};

myLogger.time = function time() {
    var args = Array.prototype.slice.call(arguments, 1);
    args[0] = "         " + arguments[0] + " | " + args[0];
    myLogger.console.time.apply(this, args);
};

myLogger.timeEnd = function timeEnd() {
    var args = Array.prototype.slice.call(arguments, 1);
    args[0] = "         " + arguments[0] + " | " + args[0];
    myLogger.console.timeEnd.apply(this, args);
};

myLogger.debug = function debug() {
    if (isDebug) {
        myLogger.console.info.apply(this, arguments);
    }         
}; 

module.exports = myLogger;
