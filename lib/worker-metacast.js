var Worker = require('./device-channel-worker.js');

var WorkerMetacast = function(channel, channelType, id) {
  var self = this;
  this.worker = new Worker('metacast', channelType, id);
  
  this.available = true;
  this.setAvailable = function(val) {
    this.available = val;
    this.worker.setAvailable(val);
  }
  
  channel.on('instanceListUpdated', function(list) {
    self.worker.setOnAir(list);
  })

  this.worker.on('request', function(job, reply) {
    if (job.type === 'render') {
      if (!self.available) {
        reply('Not available');
        return;
      }
      self.setAvailable(false);
      
      channel.previewJob(job, function(err, filename) {
        self.setAvailable(true);
        reply(err, { "filename": filename });
      })
    } else if (job.type === 'take') {
      self.takeJob(job, reply)
    } else if (job.type === 'load-running-order') {
      if (job.version != '1') {
        reply('version mismatch expected "1" got "' + job.version + '"');
      } else { 
        self.loadRunningOrder(job);  
        reply(null, 'ok');
      }
    } else if (job.type === 'stop') {
      if (job.data.id != null) {
        channel.remove(job.data.id)
       .then(function() {
          reply(null, { id: job.id });
        })
       .catch(function(err) {
          console.log(err);
          reply(err, { id: job.id });
        })
      } else {
        channel.removeAll(false, job.data.keepItems)
       .then(function() {
          reply(null, { id: job.id });
        })
       .catch(function(err) {
          reply(err, { id: job.id });
        })
      }
    } else {
      reply(job.type + ' not implemented');
    }
  });

  this.loadRunningOrder = function(job) {
    var rundown = job.data.runningOrder;
    var cued = [];
 
    for (var i = 0; i < rundown.stories.length; i++) {
      var story = rundown.stories[i];
      for (var j = 0; j < story.items.length; j++) {
        var item = story.items[j];
        cued.push({id: item.mosObjId});
      }
    }
    self.worker.setCued(cued);
  }
  
  this.takeJob = function(job, reply) {
    channel.take(job.data.id); 
    reply(null, { id: job.id, result: { id: id } });
  }
}

module.exports = WorkerMetacast;