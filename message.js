//
// message.js
// The message between scheduler and render nodes
//
// Copyright Modelo XX - 2016, All rights reserved.
// 

var moment = require("moment");
var system = require('./utils/system');

var myMessage = {};

// master->slave rendering request
myMessage.M2SRenderRequest = function() {
    // protocol fields
    this.master         = "";    // the requester/master identifier
    this.sessionId      = "";    // the session id
    this.modelId        = "";    // the model scene ID
    this.workId         = -1;    // the chunk of this rendering task. Each rendering task is divided into a few chunks.
    this.files          = [];    // the model file paths (remote URLs)
    this.gpu            = true; // using GPU or not
    this.resolution     = [];    // the resolution of the image
    this.subregion      = [];    // the subregion of this rendering task
    this.quality        = [];    // the quality of rendering (low:1-high:10)
    this.parameters     = {};    // some other rendering parameters
    this.workspace      = null;  // the local workspace of this rendering work.
    
    // used in local 
    this.localFilepaths = [];    // the local file paths
    this.ticket         = -1;    // the id of task on renderer since bootup
    this.completed      = false; // whether this request is completed at master
    this.renderFilePath = null;  // the scene file to be rendered in renderer format.
};

// slave->master statsu report
myMessage.S2MStatusResponse = function() {
    // protocol
    this.slave     = ""; // the slave identifier
    this.sessionId = ""; // the model scene ID
    this.modelId   = ""; // the model scene ID
    this.workId    = -1; // the chunk of this rendering task. Each rendering task is divided into a few chunks.
    this.progress  = 0;  // how much rendering progress is done for this chunk, 0 - 100.
    this.status    = 0; // one of RENDER_STATUS_xxx
    this.msg       = ""; // the message
    this.file      = null; // the rendering output uri

    // used in local
};

myMessage.P2MRenderRequest = function() {
    // protocol
    this.sessionId      = "";    // the session id
    this.modelId        = "";    // the model scene ID
    this.ticket         = -1;    // the id of task on renderer since bootup
    this.files          = [];    // the model file paths (remote URLs)
    this.gpu            = true; // using GPU or not
    this.resolution     = [];    // the resolution of the image
    this.quality        = [];    // the quality of rendering (low:1-high:10)
    this.parameters     = {};    // some other rendering parameters

    // used in local
    this.workspace      = null;  // the local workspace of this rendering work.
};

myMessage.M2PRenderResponse = function() {
    // protocol
    this.sessionId      = "";    // the session id
    this.modelId        = "";    // the model scene ID
    this.file           = null;    // the output images
    this.status         = 0;     // one of SCHEDULER_STATUS_xxx
    this.msg            = "";    // the message

    // used in local
    this.workId         = 0;  
};

// create render requests from a portal server rendering request to 
// master->slave rendering requests.
myMessage.splitRenderRequest = function(request, master, sessionId, number) {
    var requests = [];
    var x = 0;
    var width = Math.round(request.resolution[0] / number);
    for (var i = 0; i < number; i++) {
        var req = new myMessage.M2SRenderRequest();

        req.master     = master;
        req.sessionId  = sessionId;
        req.modelId    = request.modelId;
        req.workId     = i;
        req.files      = request.files;
        req.resolution = request.resolution;
        req.quality    = request.quality;
        req.parameters = request.parameters;
        if (i != number - 1) {
            req.subregion  = [x, 0, width, request.resolution[1]];
        } else {
            req.subregion  = [x, 0, request.resolution[0] - x, request.resolution[1]];
        }

        x += width;

        console.log(req.subregion);

        requests.push(req);
    }

    return requests;
};

myMessage.isRenderRequestsSame = function(req1, req2) {
    return req1.sessionId === req2.sessionId &&
            req1.subregion[0] === req2.subregion[0] &&
            req1.subregion[1] === req2.subregion[1] &&
            req1.subregion[2] === req2.subregion[2] &&
            req1.subregion[3] === req2.subregion[3];
};

myMessage.RENDER_STATUS_DOWNLOADING = 100;
myMessage.RENDER_STATUS_CONVERTING  = 200;
myMessage.RENDER_STATUS_RENDERING   = 300;
myMessage.RENDER_STATUS_UPLOADING   = 400;
myMessage.RENDER_STATUS_FINISH      = 500;
myMessage.RENDER_STATUS_FAILED      = 1000;
myMessage.RENDER_STATUS_DUPLICATED  = 1100;

myMessage.SCHEDULER_STATUS_DISTRIBUTED = 200;
myMessage.SCHEDULER_STATUS_RENDERING   = 300;
myMessage.SCHEDULER_STATUS_UPLOADING   = 400;
myMessage.SCHEDULER_STATUS_FINISH      = 500;
myMessage.SCHEDULER_STATUS_FAILED      = 1000;

module.exports = myMessage;
