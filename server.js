//
// server.js
// The main entry of the render scheduler and render node
//
// Copyright Modelo XX - 2016, All rights reserved.
// 
// usage:
// node server.js [--debug] [--master|--slave] 
// [--debug] running a local HTTP server to wait for requests
// [--master] scheduler mode, connecting portal server, receive rendering task and distribute task to rendering nodes
// [--slave] rendering node mode, get rendering task from scheduler and send back rendering images

var global = require("./global");

for (var i = 2, len = process.argv.length; i < len; i++) {
    if (process.argv[i] === "--debug") {
        global.debugging = true;
    } else if (process.argv[i] === "--master") {
        global.master = true;
    } else if (process.argv[i] === "--slave") {
        global.master = false;
    }
}


var services  = require("./services");
var logger    = require("./utils/log");

logger.start(true); //global.debugging);

var startingMessage = "Starting a " + (global.debugging? "debugging " : "") + 
    (global.master? "rendering scheduler" : "rendering node");
logger.info(logger.OTHER, startingMessage);

process.on("uncaughtException", function(err) {
    // FIXME: consider using console instead of log
    logger.info("uncaught exception: " + err.message);
    logger.info(err.stack);
});

function atExit() {
    if (global.debugging) {
        // Start a local HTTP server if it is a local debugging process
        services.httpd.stop();
    } 
    if (!global.debugging || global.master) {
        services.amqpd.stop();
    }
    services.sentryd.stop();

    logger.finish();
};

// When receive exit event
process.on("exit", function() {
    atExit();
});
// When receive Ctrl + C
process.once('SIGINT', function() {
    atExit();
});

if (global.debugging) {
    // Start a local HTTP server if it is a local debugging process
    services.httpd.start();
}
//services.sentryd.start();
if (!global.debugging || global.master) {
    services.amqpd.start();
}

// A test amqp request
function Test() {
    var req = null;
}
