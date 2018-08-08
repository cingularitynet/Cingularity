// render/renderants.js
// Construct an RenderAnts rendering command line
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var system = require("../utils/system");
var configs = require("../global").config();
var path = require("path");

var myRenderAnts = {};

var findMatch=function(a,re){
	for(var i=0;i<a.length;i++){
		if(a[i].match(re)){
			return a[i];
		}
	}
	return null;
};

myRenderAnts.createRenderCommand = function(req) {
    var cmdline = {
        "exec": null, 
        "output": null,
        "args": [], 
    };

    cmdline.exec = path.join(system.getBinaryPath(), "win32", "renderants", "rendermodelo_d.exe");
    cmdline.output = path.join(req.workspace, req.sessionId + "__" + req.workId + "." + configs.imageFormat);

    cmdline.args = [
        "-i",
        findMatch(req.localFilepaths,(/.*[\\/]scene.json/i)),
        "-r",
        req.resolution[0],
        req.resolution[1],
        "-rg",
        req.subregion[0],
        req.subregion[1],
        req.subregion[0] + req.subregion[2] - 1,
        req.subregion[1] + req.subregion[3] - 1,
        "-o",
        cmdline.output];

    return cmdline;
};

myRenderAnts.createConvertCommand = function(req) {
    var cmdline = {
        "exec": null, 
        "output": null,
        "args": [], 
    };

    cmdline.exec = path.join(system.getBinaryPath(), "win32", "renderants", "rendermodelo_d.exe");
    cmdline.output = path.join(req.workspace, req.sessionId + "__" + req.workId + "." + configs.imageFormat);
    cmdline.filepath = findMatch(req.localFilepaths,(/.*[\\/]scene.json/i));

    cmdline.args = [
        "-i",
        findMatch(req.localFilepaths,(/.*[\\/]scene.json/i)),
        "-r",
        req.resolution[0],
        req.resolution[1],
        "-rg",
        req.subregion[0],
        req.subregion[1],
        req.subregion[0] + req.subregion[2] - 1,
        req.subregion[1] + req.subregion[3] - 1,
        "--converter"];
    
    return cmdline;
};

myRenderAnts.isSceneFile = function(file) {
    return false;
};

myRenderAnts.reportProgress = function(str) {
    console.log(str);//todo
    var matched = str.match(/(\d+)%/);
    if (matched) {
        return matched[1];
    }
    return null;
};

module.exports = myRenderAnts;
