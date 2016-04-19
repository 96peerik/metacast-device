var DataEngine = require('node-dataengine-client').DataEngine;
var Replier = require('node-dataengine-client').Messaging.RequestReply.Replier;
var uuid = require('node-uuid');
var events = require('events');
var util = require('util');

var DeviceChannelWorker = function(templateType,channelType, id) {
  var bucket = 'bn.devices';
  var self = this;
  if (id != null) id = id + '';
  this.id = id || uuid.v4();
  this.deviceConnected = false;
  this.available = true;
  this.onAir = [];
  this.cued = [];

  this.de = new DataEngine({ bucket: bucket });

  this.de.connection.onConnect = function() {
    self.writeStatus();
  }
  
  this.setAvailable = function(val) {
    this.available = val;
    this.writeStatus();
  }
  
  this.setOnAir = function(list) {
    var arr = [];
    for (var i in list) {
      if (list[i]) arr.push({ id: list[i].externalId || i });
    }
    this.onAir = arr;
    this.writeStatus();
  }
  
  this.setCued = function(arr) {
    this.cued = arr;
    this.writeStatus();
  }
    
  this.writeStatus = function() {
    self.de.write(channelType + '.' + templateType + '.' + self.id, {
      templateType: templateType, 
      channelType: channelType, 
      available: self.available, 
      onAir: self.onAir,
      cued: self.cued,
      connected: self.deviceConnected
    }, { expire: 'session' });
  }
  
  this.replier = new Replier(this.de, 'bn.device.' + channelType + '.' + templateType + '.' + this.id);
  this.replier.onMessage = function(msg, cb) {
    self.emit('request', msg, cb);
  }
}

DeviceChannelWorker.prototype = {
  set connected(val) {
    this.deviceConnected = val;
    this.writeStatus();
  }
}

util.inherits(DeviceChannelWorker, events.EventEmitter);

module.exports = DeviceChannelWorker;
