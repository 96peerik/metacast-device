var Events = require('events');
var Util = require('util');
var WorkerMetacast = require('./worker-metacast.js');

var PlayoutChannel = function(options) {
  Events.EventEmitter.call(this);

  var self = this;
  var mcWorker = new WorkerMetacast(self, 'playout', options.id);

  if (options == null) throw 'PlayoutChannel contructor need options object';
  this.id = options.id;
  this.onAir;
    

  // opt = {template, data}
  this.cue = function(opt, overrideId) {
    return new Promise(function(resolve, reject) {
      resolve();
    });
  };

  this.take = function(id) {
    console.log('take', id);
    return new Promise(function(resolve, reject) {
      self.onAir = id;   
      var obj = {};
      obj[id] = true;
      mcWorker.worker.setOnAir(obj);
      resolve();
    })
  };
  
  this.takeObjects = function(obj, id /* optional */) {
    return new Promise(function(resolve, reject) {
      self.onAir = id;    
      var obj = {};
      obj[id] = true;
      mcWorker.worker.setOnAir(obj);
      resolve();
    })
  }
  
  this.remove = function(id) {
    console.log('remove', id);
    return new Promise(function(resolve, reject) {
      if (id === self.onAir) {
        self.onAir = null;
        mcWorker.worker.setOnAir({});
      }
      resolve();
    });
  }
}

Util.inherits(PlayoutChannel, Events.EventEmitter);
module.exports = PlayoutChannel;