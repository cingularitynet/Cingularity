// converter/render.js
// Run a true rendering node which uses offline renderer to render a scene. The
// render request is from master.
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var Promise    = require('promise');
var rendercore = require("./rendercore");
var configs    = require("../global").config();
var logger     = require("../utils/log");
var system     = require("../utils/system");
var services   = require("../services");
var message    = require("../message");
var path       = require("path");
var Res        = require("../message").S2MStatusResponse;
var Req        = require("../message").M2SRenderRequest;
var rendercore = require("./rendercore");
var global     = require("../global");
var process    = require("process");
var hostname   = require("os").hostname();

var myRender = {};


// Send status to master.
function SendStatus(req, status, progress, message, uri) {
    var res = new Res();

    res.slave     = hostname;
    res.sessionId = req.sessionId;
    res.modelId   = req.modelId;
    res.workId    = req.workId;
    res.status    = status;
    res.progress  = progress;
    res.msg       = message;
    res.file      = uri;

    services.amqpd.sendToMaster(res);
};

function OnRenderingProgress(req, status, progress, msg) {
    SendStatus(req, status, progress, msg); 
};

myRender.answerMock = function(filepath) {
    var req = new Req();
    req.master         = hostname;
    req.sessionId      = "local-test";
    req.modelId        = "local-model";
    req.workId         = -1;
    req.files          = [filepath];
    req.localFilepaths = [filepath];
    req.gpu            = true;
    req.resolution     = [400, 300];
    req.subregion      = [0, 0, 200, 150];
    req.quality        = 80;

    return system.createWorkspace()
        .then(function(workspace) {
            req.workspace = workspace;
            return rendercore.render(req, OnRenderingProgress);
        });
};

myRender.answerMaster = function(req) {
    var workspace = path.join(system.getWorkspaceRoot(), req.sessionId);

    // 1. initialize workspace
    return system.createWorkspace(workspace).
        then(function(workspace) {
            req.workspace = workspace;

            // 2. Download files
            SendStatus(req, message.RENDER_STATUS_DOWNLOADING, 0, "downloading files");

            var promises = [];
            
            logger.info(logger.OTHER, "#%s(%d): start to download " + JSON.stringify(req.files) + ".", 
                req.sessionId, req.workId);

            // See if it is a S3 download link
            if (typeof req.files[0] === 'object') {
                for (var i = 0, len = req.files.length; i < len; i++) {
                    promises.push(services.s3.download(req.files[i].s3Bucket, req.files[i].s3Key, 
                            req.files[i].s3Path, req.workspace));
                }
            } else {
                // It is likely a local path link used for debugging. We assume all necessary files
                // are in the same directory as the input one.
                for (var i = 0, len = req.files.length; i < len; i++) {
                    var dstFilepath = path.join(req.workspace, path.basename(req.files[i]));
                    // promises.push(system.copy(req.files[i], dstFilepath));
                    // QM: Copying the file is not enough: we have loads of dependent files like textures and meshes
                    promises.push((function(s){return new Promise(function(resolve, reject) {
                        resolve(s);
                	})})(req.files[i]));
                }
            }

            return Promise.all(promises)
                // 3. Renderering
                .then(function(filepaths) {
                    logger.info(logger.OTHER, "#%s(%d): download finishes.", req.sessionId, req.workId);

                    req.localFilepaths = filepaths.slice(0);

                    return rendercore.render(req, OnRenderingProgress);
                })
                // 4. Uploading to S3
                .then(function(res) {
                    SendStatus(req, message.RENDER_STATUS_UPLOADING, 0, "uploading");
                    if (!global.debugging) {
                        var s3ParentKey = req.sessionId;
                        logger.info(logger.S3, "#%s(%d): uploading %s starts", req.sessionId, req.workId, s3ParentKey);
                        return services.s3.upload(configs.awsS3Bucket, s3ParentKey, res.filepath);
                    } else {
                        return new Promise(function(resolve, reject) {
                            resolve(res.filepath);
                        });
                    }
                })
                // 5. Notify scheduler rendering done
                .then(function(s3Entry) {
                    var s3ParentKey = req.sessionId;
                    logger.info(logger.S3, "#%s(%d): uploading %s done", req.sessionId, req.workId, s3ParentKey);
                    SendStatus(req, message.RENDER_STATUS_FINISH, 100, "rendering work done", s3Entry);
                    // Remove the workspace for this session.
                    if (configs.deleteAlways) {
                        system.deleteDirectory(req.workspace);
                    }
                }, 
                // Handle errors
                function(err) {
                    logger.error(logger.OTHER, err.stack);
                    SendStatus(req, message.RENDER_STATUS_FAILED, 0, err);

                    // Remove the workspace for this session.
                    if (configs.deleteIfError) {
                        system.deleteDirectory(req.workspace);
                    }
                    // Pass down the errors.
                    return new Promise(function(resolve, reject) {
                        reject(err);
                    });
                });
        });
};

module.exports = myRender;
