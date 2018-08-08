//
// scheduler/schedulecore.js
// The scheduler core
//
// Copyright Modelo XX - 2016, All rights reserved.
// 


var Promise    = require('promise');
var configs    = require("../global").config();
var logger     = require("../utils/log");
var system     = require("../utils/system");
var services   = require("../services");
var message    = require("../message");
var os         = require("os");
var path       = require("path");
var global     = require("../global");
var Res        = require("../message").M2PRenderResponse;
var process    = require("process");

var myScheduler = {};

myScheduler.slaves = [];

function SlaveInfo(slave, lastHeard) {
    this.slave     = slave;
    this.lastHeard = lastHeard;  // the timestamp at which we hear it
};

function CreateSessionInfo(requests) {
    var sessionInfo = {};
    sessionInfo.id = requests[0].sessionId;
    sessionInfo.requests = requests;
    return sessionInfo;
};

function StitchSubimages(sessionInfo) {
    var output = path.join(system.getWorkspaceRoot(), sessionInfo.id, (sessionInfo.id + "." + configs.imageFormat));

    var promise = new Promise(function(resolve, reject) {
        if (sessionInfo.requests.length <= 1) {
            resolve(sessionInfo.requests[0].localFilepaths[0]);
        } else {
            var exec = null;
            if (system.isWin) {
                // Windows
                exec = path.join(system.getBinaryPath(), "win64", "composite", "composite");
            } else {
                // Linux
                cmdline.exec = path.join(system.getBinaryPath(), "linux64", "composite", "composite");
            }
            var args = [];

            for (var i = 0, len = sessionInfo.requests.length; i < len; ++i) {
                var subimage = path.join(system.getWorkspaceRoot(), sessionInfo.id, 
                        sessionInfo.id + "__" + i + "." + configs.imageFormat);
                args.push(subimage);
            }
            args.push(output);

            system.provoke(exec, args, function(err) {
                if (err) {
                    logger.error(logger.SCHEDULER, "composite failed, error code: %d", err.code);
                    reject('composite error');
                } else {
                    resolve(output);
                }
            });
        }
    });

    return promise;
};

function DownloadFile(file, sessionId, workspace) {
    if (typeof file === 'object') {
        logger.info(logger.S3, "#%s: starting downloading images %s.", sessionId, file.s3FileName);
        return services.s3.download(file.s3Bucket, file.s3Key, file.s3Path, workspace);
    } else {
        logger.info(logger.OTHER, "#%s: starting downloading image %s.", sessionId, file);
        var dstFilepath = path.join(workspace, path.basename(file));
        return system.copy(file, dstFilepath);
    }
};

function DownloadSubimage(sessionInfo, res) {
    logger.info(logger.SCHEDULER, "#%s(%d): %d(%d%%) - %s", 
        res.sessionId, res.workId, res.status, res.progress, res.msg);

    var workspace = path.join(system.getWorkspaceRoot(), sessionInfo.id);

    return DownloadFile(res.file, res.sessionId, workspace)
        .then(function(filepath) {
            logger.info(logger.S3, "#%s: downloading image done.", res.sessionId);

            sessionInfo.requests[res.workId].localFilepaths.push(filepath);
            sessionInfo.requests[res.workId].completed = true;

            services.db.write(sessionInfo.id, sessionInfo);

            // Check if all complete
            var completed = true;
            for (var i = 0 , len = sessionInfo.requests.length; i < len; i++) {
                if (!sessionInfo.requests[i].completed) {
                    completed = false;
                }
            }

            // If so, stitch all subimages and upload it
            if (completed) {
                logger.info(logger.SCHEDULER, "#%s: stitch %d subimages", 
                        sessionInfo.id, sessionInfo.requests.length);
                return StitchSubimages(sessionInfo)
                    .then(function(imageFilepath) {
                        if (!global.debugging) {
                            logger.info(logger.SCHEDULER, "#%s: completed and uploading to S3.", sessionInfo.id);
                            return services.s3.upload(configs.awsS3Bucket, sessionInfo.id, imageFilepath, true);
                        }
                    })
                    .then(function(s3File) {
                        logger.info(logger.SCHEDULER, "#%s: rendering completed: %s", sessionInfo.id, s3File[0]);

                        if (!global.debugging) {
                            var resToPortal = new message.ResToPortal;
                            resToPortal.sessionId = res.sessionId;
                            resToPortal.modelId   = res.modelId;
                            resToPortal.status    = message.SCHEDULER_STATUS_FINISH;
                            resToPortal.msg       = "rendering done";
                            resToPortal.file      = s3File[0];

                            services.amqpd.sendToPortal(resToPortal);
                        } 
                            
                        // Delete the workspace
                        if (configs.deleteAlways) {
                            logger.info(logger.SCHEDULER, "#%s: removed workspace.", sessionInfo.id);
                            system.deleteDirectory(workspace)
                        }
                    },
                    function(err) {
                        logger.error(logger.SCHEDULER, "#%s: failed to stitch image.", sessionInfo.id);
                        logger.info(logger.SCHEDULER, err);

                        if (!global.debugging) {
                            var resToPortal = new message.ResToPortal;
                            resToPortal.sessionId = sessionInfo.id;
                            resToPortal.modelId   = sessionInfo.requests[0].modelId;
                            resToPortal.status    = message.SCHEDULER_STATUS_FAILED;
                            resToPortal.msg       = err;
                            services.amqpd.sendToPortal(resToPortal);
                        }

                        if (configs.deleteIfError) {
                            system.deleteDirectory(workspace);
                        }
                        
                        return new Promise(function(resolve, reject) {
                            resolve({sessionId: sessionInfo.id, workId: res.workId});
                        });

                        // TODO: noify workers to abort this session.
                    });
            } else {
                return new Promise(function(resolve, reject) {
                    resolve({sessionId: sessionInfo.id, workId: res.workId});
                });
            }
        })
        .catch(function(err) {
            logger.error(logger.SCHEDULER, err);
        });
}

function UpdateProgress(sessionInfo, res) {
    return new Promise(function(resolve, reject) {
        logger.info(logger.SCHEDULER, "#%s(%d): %d(%d%%) - %s", 
            res.sessionId, res.workId, res.status, res.progress, res.msg);

        // TODO: Compute the rendering percentage.
        //var resToPortal = new ResToPortal;
        //resToPortal.sessionId = res.sessionId;
        //resToPortal.modelId   = res.modelId;
        //resToPortal.status    = message.SCHEDULER_STATUS_RENDERING;
        //resToPortal.message   = "in rendering";

        resolve(res);
    });
};

function HandleFailure(sessionInfo, res) {
    // TODO: cancel the reset of the rendering work for this session.
    return new Promise(function(resolve, reject) {
        logger.error(logger.SCHEDULER, "#%s(%d): rendering fails with error %s", res.sessionId, res.workId, JSON.stringify(res.msg));
        reject(res);
    });
};
    
myScheduler.distribute = function(req) {
    logger.info(logger.SCHEDULER, "#%s: start rendering session ", req.sessionId);
    logger.info(logger.SCHEDULER, "#%s: resolution:%dx%d, quality:%d",
            req.sessionId, req.resolution[0], req.resolution[1], req.quality);

    // The slaves information are updated whenever a response coming back from
    // a rendering node. Thus at the beginning, we have no slaves information
    // at all. We add one following to boostrap the rendering distribution.
    var numRequests = myScheduler.slaves.length + 1;
    if (numRequests > configs.maxNumSlaves) {
        numRequests = configs.maxNumSlaves;
    }
    var requests = message.splitRenderRequest(req, os.hostname(), req.sessionId, numRequests);
    
    logger.info(logger.SCHEDULER, "#%s: distribute to %d workers.", req.sessionId, numRequests);

    // Send requests out to rendering nodes
    for (var i = 0, len = requests.length; i < len; ++i) {
        services.amqpd.sendToSlave(requests[i]);
    }

    var sessionInfo = CreateSessionInfo(requests);

    // Write requests to persistent storage.
    services.db.write(req.sessionId, sessionInfo);
    logger.info(logger.SCHEDULER, "#%s: save session to database", req.sessionId);
};

myScheduler.receive = function(res) {

    // Update the slave information
    var found = false;
    var currentTime = new Date().getTime() / 1000;
    for (var i = 0, len = myScheduler.slaves.length; i < len; ++i) {
        if (myScheduler.slaves[i].slave === res.slave) {
            found = true;
            myScheduler.slaves[i].lastHeard = currentTime;
        }
    }
    if (!found) {
        logger.info(logger.SCHEDULER, "sees a new slave %s.", res.slave);
        myScheduler.slaves.push(new SlaveInfo(res.slave, currentTime));
    }
    
    var slaves = [];
    // Remove dead rendering nodes if we have not heard from it for 12 hours
    for (var i = 0, len = myScheduler.slaves.length; i < len; ++i) {
        if (currentTime - myScheduler.slaves[i].lastHeard < 12 * 3600) {
            slaves.push(myScheduler.slaves[i]);
        }
    }
    myScheduler.slaves = slaves;

    // Respond to the slaves data
    var sessionInfo = services.db.read(res.sessionId);

    switch (res.status) {
        case message.RENDER_STATUS_DOWNLOADING:
        case message.RENDER_STATUS_CONVERTING:
        case message.RENDER_STATUS_RENDERING:
        case message.RENDER_STATUS_UPLOADING:
            return UpdateProgress(sessionInfo, res);
        case message.RENDER_STATUS_FINISH:
            return DownloadSubimage(sessionInfo, res);
        case message.RENDER_STATUS_FAILED:
        case message.RENDER_STATUS_DUPLICATED:
            return HandleFailure(sessionInfo, res);
        default:
            return new Promise(function(resolve, reject) {
                logger.error(logger.SCHEDULER, "either undefined or unknown response status");
                reject("unknown slave status.");
            });
    }
};

module.exports = myScheduler;
