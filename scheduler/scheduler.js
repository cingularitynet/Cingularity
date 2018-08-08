// scheduler/schedulerlocal.js
// Run a local mock scheduler
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var Promise       = require('promise');
var configs       = require("../global").config();
var logger        = require("../utils/log");
var system        = require("../utils/system");
var schedulercore = require("./schedulercore");
var Req           = require("../message").P2MRenderRequest;
var path          = require("path");

var myScheduler = {};

// Answer HTTP requests (mock server)
myScheduler.answerMock = function(filepath) {
    var req = new Req();
    req.modelId        = "local-model";
    req.gpu            = true;
    req.resolution     = [400, 300];
    req.quality        = 80;

    return system.createWorkspace() 
        .then(function(workspace) {
            req.sessionId = path.basename(workspace);
            req.workspace = workspace;
            return system.listFiles(path.dirname(filepath));
        })
        .then(function(files) {
            req.files = files;
            return schedulercore.distribute(req);
        });
};

// Answer requests from portal through AMQP
myScheduler.answerPortal = function(req) {
    var workspace = path.join(system.getWorkSpacesRoot, req.sessionId);
    
    return system.createWorkspace(workspace) 
        .then(function(workspace) {
            req.workspace = workspace;
            return schedulercore.distribute(req);
    });
};

// Handle responses from slaves through AMQP
myScheduler.answerSlave = function(res) {
    // res: S2MRenderResponse
    return schedulercore.receive(res);
};

module.exports = myScheduler;

