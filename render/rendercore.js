// render/rendercore.js
// Convert and then render a scene using parameters from scheduler.
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var path        = require("path");
var Promise     = require("promise");
var configs     = require("../global").config();
var logger      = require("../utils/log");
var system      = require("../utils/system");
var services    = require("../services");
var gpuRenderer = require("./renderants");
//var cpuRenderer = require("./arnold"); // uncomment this line if using solid Arnold
var cpuRenderer = require("./vray"); // uncomment this line if using Vray
//var cpuRenderer = require("./mock"); // it is a mock renderer for server development
var spawn       = require("child_process").spawn;
var message     = require("../message");
var process     = require("process");

var myRender = {};

myRender.requests = [];

// error code:
// 0: "Success",
// 1: "Failed to find such file on the disk",
// 2: "Reading or parsing the file error",
// 3: "I/O error",
// 4: "The model does not contain a mesh",
// 5: "The model needs to be triangulated",
// 6: "Insufficent memory",
// 7: "Missing auxilary files",
// 8: "Not supported file format"
// 9: "Conversion takes too long"
var CONVERTER_ERROR_MESSAGES = [
    "Success",
    "Failed to find such file on the disk",
    "Reading or parsing the file error",
    "I/O error",
    "The model does not contain a mesh",
    "The model needs to be triangulated",
    "Insufficent memory",
    "Missing auxilary files",
    "Not supported file format",
    "Conversion takes too long"
];

function DoRender(req, onProgress) {
    var cmdline = null;
    var renderer = null;
    if (req.gpu) {
        cmdline = gpuRenderer.createRenderCommand(req);
        renderer = gpuRenderer;
        logger.info(logger.RENDER, "#%s(%d): use GPU rendering",
            req.sessionId, req.workId);
    } else {
        cmdline = cpuRenderer.createRenderCommand(req);
        renderer = cpuRenderer;
        logger.info(logger.RENDER, "#%s(%d): use CPU rendering", 
            req.sessionId, req.workId);
    }
    
    logger.info(logger.RENDER, "#%s(%d): region:[%d,%d,%d,%d], quality:%d",
            req.sessionId, req.workId,
            req.subregion[0], req.subregion[1], req.subregion[2], req.subregion[3], req.quality);

    logger.info(logger.RENDER, cmdline.exec + " " + cmdline.args.join(" "));

    return new Promise(function(resolve, reject) {
        var render = spawn(cmdline.exec, cmdline.args);

        render.stdout.on("data", function(data) {
            var str = data.toString();
            var progress = renderer.reportProgress(str);
            if (progress !== null) {
                logger.info(logger.RENDER, "#%s(%d): %d%% rendering done", 
                    req.sessionId, req.workId, progress);
                if (onProgress) {
                    onProgress(req, message.RENDER_STATUS_RENDERING, progress, "rendering");
                }
            } 
        });
        
        render.stderr.on("data", function(data) {
            logger.warn(logger.RENDER, data.toString());
        });

        render.on("exit", function(errcode) {
            if (errcode === 0) {
                resolve({"ticket": req.ticket, "filepath": cmdline.output});
            } else {
                logger.error(logger.RENDER, "renderer failed with code %d.", errcode);
                // TODO: handle the error
                reject({err: errcode, msg:"renderer failed"});
            }
        });
    });
};

function DoConvert(req, onProgress) {
    onProgress(req, message.RENDER_STATUS_CONVERTING, 0, "converting");

    var isValidMxFile = false;

    // Skip the files that no need for conversion.
    for (var i = 0; i < req.localFilepaths.length; i++) {
        if (cpuRenderer.isSceneFile(req.localFilepaths[i]) ||
            gpuRenderer.isSceneFile(req.localFilepaths[i])) {

            return new Promise(function(resolve, reject) {
                resolve(req.localFilepaths[i]);
            });
        } else if (path.basename(req.localFilepaths[i]) === "scene.json") {
            isValidMxFile = true;
        }
        console.log(req.localFilepaths[i]);
    }

    // If it is not a valid MX file, we return error.
    if (!isValidMxFile) {
        return new Promise(function(resolve, reject) {
            reject("Not a valid MX file.");
        });
    }

    // Generate the conversion command line and execute the command line.
    var cmdline = null;
    if (req.gpu) {
        cmdline = gpuRenderer.createConvertCommand(req);
    } else {
        cmdline = cpuRenderer.createConvertCommand(req);
    }
    
    if(cmdline === null){
    	logger.info(logger.CONVERT, "#%s(%d): no conversion needed", req.sessionId, req.workId);
    } else {
    	logger.info(logger.CONVERT, "#%s(%d): executing %s", req.sessionId, req.workId, 
    	       cmdline.exec + " " + cmdline.args.join(" "));
    }

    // FIXME: many times we found the file is not readable at once, so we retry the command
    // a few times in case the file is not ready.
    var tries = 0;
    var maxTries = 3;
    return new Promise(function(resolve, reject) {
        if (cmdline === null){
        	resolve({"ticket": req.ticket, "filepath": req.localFilepaths[0]});
        	return;
        }
        var runCmdFn = function() {
            var cmdCallbackFn = function(err) {
                tries++;
                if (err && (err.code !== 7 && 
                        err.code > 0 &&
                        err.code < CONVERTER_ERROR_MESSAGES.length)) {
                    if (tries >= maxTries || err.code === 9) { // either timeout or exceed maximum tries
                        logger.info(logger.CONVERT, "#%s(%d): failed (error = %d)", err.code);
                        reject("conversion failed");
                    } else {
                        setTimeout(function() {
                            logger.info(logger.CONVERT, "#%s(%d): try again", req.sessionId, req.workId);
                            runCmdFn();
                        }, 3000);
                    }
                } else {
                    resolve(cmdline.output);
                }
            };
            system.provoke(cmdline.exec, cmdline.args, cmdCallbackFn);
        };

        runCmdFn();
    });
};

myRender.render = function(req, onProgress) {
    // Check if the render request is duplicated with previous one.
    for (var i = 0, len = myRender.requests.length; i < len; ++i) {
        if (message.isRenderRequestsSame(myRender.requests[i], req)) {
            logger.warn(logger.OTHER, "#%s(%d): a previous duplicated rendering request found! Ignore this one.", 
                    req.sessionId, req.workId);
            return new Promise(function(resolve, reject) {
                reject(message.RENDER_STATUS_DUPLICATED);
            });
        }
    }

    myRender.requests.push(req);

    logger.info(logger.OTHER, "#%s(%d): rendering starts at %s", req.sessionId, req.workId, req.workspace);

    logger.time(logger.CONVERT, "#" + req.sessionId + "(" + req.workId + "): converting takes");
    return DoConvert(req, onProgress)
        .then(function(renderFilePath) {
            logger.info(logger.CONVERT, "#%s(%d): converting finishes", req.sessionId, req.workId);
            logger.timeEnd(logger.CONVERT, "#" + req.sessionId + "(" + req.workId + "): converting takes");

            req.renderFilePath = renderFilePath;

            logger.time(logger.RENDER, "#" + req.sessionId + "(" + req.workId + "): rendering takes");
            return DoRender(req, onProgress)
                .then(function(result) {
                    logger.timeEnd(logger.RENDER, "#" + req.sessionId + "(" + req.workId + "): rendering takes");

                    // Remove the fnished request from the queue.
                    var deleted = false;
                    for (var i = 0, len = myRender.requests.length; i < len; ++i) {
                        if (message.isRenderRequestsSame(myRender.requests[i], req)) {
                            myRender.requests.splice(i, 1);
                            deleted = true;
                            break;
                        }
                    }

                    if (!deleted) {
                        // we don't find such rendering task in the queue.
                        logger.warn(logger.RENDER, "#%s(%d): finished a unrecorded rendering request.", 
                            req.sessionId, req.workId);
                    } else {
                        logger.info(logger.RENDER, "#%s(%d): rendering finishes.", 
                            req.sessionId, req.workId);
                    }

                    return result;
                });
    });
};

// Check if there is too many awaiting rendering tasks
myRender.isBusy = function() {
    return myRenderer.requests.length > 2;
};

module.exports = myRender;
