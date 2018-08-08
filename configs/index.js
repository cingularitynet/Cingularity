//
// configs/index.js
// The main entry of global configuration
//
// Copyright Modelo XX - 2016, All rights reserved.

var config = {
    development: require("./development.json"),
    test: require("./test.json"),
    production: require("./production.json")
};
//module.exports = config[process.env.NODE_ENV || "test"];
module.exports = config;
