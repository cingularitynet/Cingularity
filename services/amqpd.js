// services/amqpd.js
// A server running amqpd that connects to scheduler server. 
// 
// All rights reserved. Modelo, Inc xx - 2016
//

// http://www.rabbitmq.com/tutorials/amqp-concepts.html
// http://www.squaremobius.net/amqp.node/
var amqp       = require("amqplib");
var Promise    = require('promise');
var moment     = require("moment");
var configs    = require("../global").config();
var logger     = require("../utils/log");
var global     = require("../global");
var render     = require("../render");
var scheduler  = require("../scheduler");
var process    = require("process");

var myAMQP = {
    master: {
        inqueue:    null,
        outqueue:   null,
        outchannel: null,
        connection: null,
        requests:   0
    },
    slave: {
        inqueue:    null,
        outqueue:   null,
        outchannel: null,
        connection: null,
        requests:   0
    },

    start:      null,
    stop:       null,
};
    

var makeConsumerForMasterFromPortal = function(ch) {
    return function(msg) {
        try {
            var body = msg.content.toString();
            var cmd = JSON.parse(body); // message.P2MRenderQuest

            logger.info(logger.AMQP, "#%d receive modelId %s.", myAMQP.requests, cmd.modelId);

            converter.convert(myAMQP.requests, cmd.modelId, cmd.requester, cmd.files)
                .then(function() {
                    ch.ack(msg);
                    logger.info(logger.AMQP, "#%d handling modelId %s done.\n\n", myAMQP.requests, cmd.modelId);
                    myAMQP.requests++;
                });
            
        } catch(err) {
            ch.ack(msg);
            logger.error(logger.AMQP, err.stack);
        }
    };
};

var makeConsumerForSlaveFromMaster = function(ch) {
    return function(msg) {
        try {
            var body = msg.content.toString();
            var req = JSON.parse(body); // message.M2SRenderRequest

            logger.info(logger.AMQP, "received session %s.", req.sessionId);

            render.answerMaster(req)
                .then(function(res) {
                    ch.ack(msg);
                    logger.info(logger.AMQP, "finished session %s.\n\n", req.sessionId);
                })
                .catch(function(err) {
                    logger.info(logger.AMQP, "session %s failed.\n\n", req.sessionId);
                    // Requeue the message when failed.
                    ch.ack(msg);
                });
            
        } catch(err) {
            ch.ack(msg);
            logger.error(logger.AMQP, err.stack);
        }
    };
};

var makeConsumerForMasterFromSlave = function(ch) {
    return function(msg) {
        try {
            var body = msg.content.toString();
            var res = JSON.parse(body); // message.S2MRenderResponse

            logger.info(logger.AMQP, "#%s: received from slave %s.", res.sessionId, res.slave);

            scheduler.answerSlave(res)
                .then(function(res) {
                    ch.ack(msg);
                })
                .catch(function(err) {
                    ch.ack(msg);
                    logger.error(logger.OTHER, err.stack);
                });
        } catch(err) {
            ch.ack(msg);
            logger.error(logger.AMQP, err.stack);
        }
    };
};

function Send(amqpObject, obj) {
    if (!amqpObject.connection || !amqpObject.outchannel) {
        logger.error(logger.AMQP, "connection or outchannel of %s is not established.", amqpObject.outchannel);
    } else {
        var msg = JSON.stringify(obj);
        amqpObject.outchannel.sendToQueue(amqpObject.outqueue, new Buffer(msg), {deliveryMode: true});
        //logger.info(logger.AMQP, "send something out to " + amqpObject.outqueue);
    }
};

myAMQP.sendToSlave = function(obj) {
    Send(myAMQP.slave, obj);
};

myAMQP.sendToMaster = function(obj) {
    // NOTE: it looks the same as sendToSlave but the connection is
    // different between master and slave mode.
    Send(myAMQP.slave, obj);
};

myAMQP.sendToPortal = function(obj) {
    Send(myAMQP.master, obj);
};

function Connect(uri, amqpObject, makeConsumer) {
    amqp.connect(uri)
        .then(function(conn) {
            amqpObject.connection = conn;

            // We started a queue
            logger.info(logger.AMQP, "AMQP server starts on %s.", uri);

            // Create a channel and register a a consumer for incoming events
            var promise = null;
            var promises = [];

            promise = conn.createChannel().then(function(ch){
                return ch.assertQueue(amqpObject.inqueue, {durable: true}).then(function() {
                    // Back server can only send one request at a time in favor of load balance
                    ch.prefetch(1); 
                }).then(function() {
                    ch.consume(amqpObject.inqueue, makeConsumer(ch), {noAck: false});
                    logger.info(logger.AMQP, "incoming queue %s is created.", amqpObject.inqueue);
                });
            });
            promises.push(promise);

            // Create the outqueue for outcoming events
            promise = conn.createChannel().then(function(ch) {
                return ch.assertQueue(amqpObject.outqueue, {durable: true})
                    .then(function() {
                        logger.info(logger.AMQP, "outcoming queue %s is created.", amqpObject.outqueue);
                        amqpObject.outchannel = ch;
                    });
            });
            promises.push(promise);

            return Promise.all(promises);
        }, function(err) {
            logger.error(logger.AMQP, "failed to connect to AMQP server: " + uri);
            logger.info(logger.AMQP, "The error is: " + err);

            setTimeout(function() {
                process.exit(-1);
            }, 1000);
        })
        .then(null,
            function(err) {
                logger.error(logger.AMQP, "failed to connect to queues: %s and %s.", amqpObject.inqueue, amqpObject.outqueue);
                logger.info(logger.AMQP, "The error is: " + err);

                setTimeout(function() {
                    process.exit(-1);
                }, 1000);
            });
};

function Shutdown(amqpObject) {
    if (amqpObject.connection) {
        if (amqpObject.inqueue) {
            logger.info(logger.AMQP, "shutdown queue %s.", amqpObject.inqueue);
        }
        if (amqpObject.outqueue) {
            logger.info(logger.AMQP, "shutdown queue %s.", amqpObject.outqueue);
        }
        amqpObject.connection.close();
        amqpObject.connection = null;
    }
};

myAMQP.start = function() {
    if (global.master) {
        if (myAMQP.master.connection) {
            logger.warn(logger.AMQP, "master AMQP already connected.");
            return ;
        }

        if (!global.debugging) {
            myAMQP.master.inqueue = "render_request_queue";
            myAMQP.master.outqueue = "render_response_queue";

            Connect(configs.masterAmqpURI, myAMQP.master, makeConsumerForMasterFromPortal);
        } 
        
        myAMQP.slave.outqueue = "render_task_request_queue";
        myAMQP.slave.inqueue = "render_task_response_queue";
        Connect(configs.slaveAmqpURI, myAMQP.slave, makeConsumerForMasterFromSlave);
    } else {
        if (myAMQP.slave.connection) {
            logger.warn(logger.AMQP, "master AMQP already connected.");
            return ;
        }

        myAMQP.slave.outqueue = "render_task_response_queue";
        myAMQP.slave.inqueue = "render_task_request_queue";
        Connect(configs.slaveAmqpURI, myAMQP.slave, makeConsumerForSlaveFromMaster);
    }
};

myAMQP.stop = function() {
    if (global.master) {
        Shutdown(myAMQP.master);
        if (!global.debugging) {
            Shutdown(myAMQP.slave);
        }
    } else {
        Shutdown(myAMQP.slave);
    }

    logger.info(logger.AMQP, "AMQP server stops.");
};


module.exports = myAMQP;


