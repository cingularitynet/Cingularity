//
// global.js
// The global variables
//
// Copyright Modelo XX - 2016, All rights reserved.
// 

var configs = require("./configs");

var myGlobal = {};

myGlobal.debugging = false;
myGlobal.master    = false;
myGlobal.slave     = false;

myGlobal.config = function() {
    if (this.debugging) {
        return configs["test"];
    }

    return configs[process.env.NODE_ENV || "test"];
};

module.exports = myGlobal;
