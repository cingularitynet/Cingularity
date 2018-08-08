// services/sentryd.js
// The wrapper of sentry
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var raven      = require("raven");
var nodemailer = require("nodemailer");
var os         = require('os');
var logger     = require('../utils/log');
var configs    = require("../global").config();


var mySentry = {
    client: null,
    ip: null
};

var smtpTransport = nodemailer.createTransport("SMTP", configs.SMTPSetting);

mySentry.start = function() {
    
    mySentry.client = new raven.Client(configs.sentryDSN);
    //mySentry.client.setUserContext({});

    // get local ip address
    var ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                return;
            }

            if (alias >= 1) {
                mySentry.ip = iface.address;
                // this single interface has multiple ipv4 addresses
                //console.log(ifname + ':' + alias, iface.address);
            } else {
                mySentry.ip = iface.address;
                // this interface has only one ipv4 adress
                //console.log(ifname, iface.address);
            }
            ++alias;
        });
    });
        
    logger.info("connected to sentry server sentry.modelo.io");

    return true;
};

mySentry.stop = function() {
    mySentry.client = null;
    mySentry.ip = null;
};

mySentry.report = function(req, error) {
    var msg = 
        "message:    " + error.message + "\n" +
        "statusCode: " + error.statusCode + "\n" +
        "cvtserver:  " + mySentry.ip + "\n" +
        "workspace:  " + req.workspace + "\n" +
        "modelId:    " + req.modelId + "\n" +
        "requester:  " + req.requester + "\n";
    if (req.files) {
        msg += JSON.stringify(req.files);
    } else {
        msg += 
            "filepath:   " + req.localFilepaths + "\n";
    }
    
    for(var i = 0; i < configs.emailList.length; i++) {
        var mailOptions = configs.mailOptions;
        mailOptions.html = msg;
        mailOptions.to = configs.emailList[i];
        smtpTransport.sendMail(mailOptions, function(error, response) {
            if (error) {
                logger.error(error);
            } else {
                logger.info("Send error message to " + mailOptions.to + " " + response.message);
            }
            smtpTransport.close(); // close the pool if unnecessary
        });
    }
    
    mySentry.client.captureMessage(msg);
};

module.exports = mySentry;

