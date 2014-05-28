var zmq = require('zmq');
var util = require('util');
var events = require('events');
var MDP = require('./consts');

var HEARTBEAT_LIVENESS = 3;

function Worker (broker, service) {
  var self = this;

  self.broker = broker;
  self.service = service;

  self.heartbeat = 2500;
  self.reconnect = 2500;
  self.expectReply = false;

  events.EventEmitter.call(this);
}
util.inherits(Worker, events.EventEmitter);

Worker.prototype.start = function () {
  var self = this;
  self.connectToBroker();
};

Worker.prototype.stop = function () {
  var self = this;

  clearInterval(self.hbTimer);
  if (self.socket) {
    self.sendDisconnect();
    self.socket.close();
    delete self['socket'];
  }
};

// Connect or reconnect to broker
Worker.prototype.connectToBroker = function () {
  var self = this;

  if (self.socket) {
    self.socket.close();
  }
  self.socket = zmq.socket('dealer');
  self.socket.setsockopt('linger', 0);

  self.socket.on('message', function () {
    self.onMsg.call(self, arguments);
  });

  self.socket.connect(self.broker);

  self.sendReady();
  self.liveness = HEARTBEAT_LIVENESS;

  self.hbTimer = setInterval(function () {
    self.sendHeartbeat();
    self.liveness--;
    if (!self.liveness) {
      clearInterval(self.hbTimer);
      console.log('Disconnected from broker - retrying in %s sec(s)...', (self.reconnect / 1000));
      setTimeout(function () {
        self.connectToBroker();
      }, self.reconnect);
    }
  }, self.heartbeat);
};

// process message from broker
Worker.prototype.onMsg = function (msg) {
  var self = this;

  var header = msg[1].toString();
  var type = msg[2];

  self.liveness = HEARTBEAT_LIVENESS;

  if (header !== MDP.WORKER) {
    self.emitErr('Invalid message header \'' + header + '\'');
    // send error
    return;
  }

  if (type == MDP.W_REQUEST) {
    var client = msg[3];
    var data = msg[5].toString();

    self.onRequest(client, data);
  } else if (type == MDP.W_HEARTBEAT) {
    // Do nothing for heartbeats
    // console.log('W: HEARTBEAT from broker');
  } else if (type == MDP.W_DISCONNECT) {
    console.log("Exiting by request of broker");
    self.stop();
	  process.exit();
  } else {
    self.emitErr('Invalid message type \'' + type.toString() + '\'');
    // send error
    return;
  }
};
Worker.prototype.emitReq = function (input, reply) {
  var self = this;

  self.emit.apply(self, ['request', input, reply]);
};

Worker.prototype.emitErr = function (msg) {
  var self = this;

  self.emit.apply(self, ['error', msg]);
};

Worker.prototype.onRequest = function (client, data) {
  var self = this;

  var input = {};
  try {
    input = data;
  } catch (e) {
    self.emitErr('(onRequest) Parse ERROR: ' + e.toString());
    self.reply(client, 'Parse ERROR:' + e);
    return;
  }
  var rep = {
    reply: function(data) {
      self.reply(client, data);
    }
  };
  self.emitReq(input, rep);
};

Worker.prototype.sendReady = function () {
  this.socket.send([null,MDP.WORKER, MDP.W_READY, this.service]);
};

Worker.prototype.sendDisconnect = function () {
  this.socket.send([null,MDP.WORKER, MDP.W_DISCONNECT]);
};

Worker.prototype.sendHeartbeat = function () {
  this.socket.send([null,MDP.WORKER, MDP.W_HEARTBEAT]);
};

Worker.prototype.reply = function (client, data) {
  this.socket.send([null, MDP.WORKER, MDP.W_REPLY, client, data]);
};

Worker.prototype.replyError = Worker.prototype.reply;

module.exports = Worker;
