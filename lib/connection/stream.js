var value = require('../value.js'),
    ValueType = value.ValueType,
    _ = require('../internal/util.js');

var StreamState = {
  INIT: 'initialize',
  OPEN: 'open',
  CLOSED: 'closed'
};

function Stream(data) {
  data = data || [];

  this.__priv__ = {
    originalLength: data.length
  };

  this.state = this.__priv__.originalLength > 0 ? StreamState.INIT : StreamState.OPEN;
  this.data = data;
  this.limit = 100;
}

Stream.closed = function() {
  var stream = new Stream();
  stream.state = StreamState.CLOSED;
  return stream;
};

Stream.prototype.close = function(error) {
  this.state = StreamState.CLOSED;
  if(!_.isNull(error))
    this.error = error;
};

Stream.prototype.next = function() {
  if(this.data.length === 0)
    return null;
  if(this.__priv__.originalLength > 0) {
    this.__priv__.originalLength -= Math.min(this.data.length, this.limit);

    if(this.__priv__.originalLength <= 0)
      this.state = StreamState.OPEN;
  }
  return this.data.splice(0, Math.min(this.data.length, this.limit));
};

Stream.prototype.push = function(element) {
  this.data.push(element);
  return this;
};

function SubscribeStream() {
  Stream.call(this);

  this.nodes = {};
}

_.inherits(SubscribeStream, Stream);

SubscribeStream.prototype.next = function() {
  var localLimit = this.limit;
  var data = [];

  _.each(this.nodes, function(node, path) {
    if(localLimit > 0)
      return;

    var length = node.values.length;
    var value = node.values[length - 1];

    var nodeData = {
      path: path,
      value: value.value,
      timestamp: value.toISOString()
    };

    if(value.type === ValueType.NUMBER) {
      _.mixin(nodeData, {
        // TODO
      });
    }

    data.push(nodeData);

    if(localLimit - length <= 0) {
      node.values = [];
    }
    localLimit -= length;
  }, this);

  if(data.length === 0)
    return null;
  return data;
};

SubscribeStream.prototype.addNode = function(node) {
  var valueHandler = function(val) {
    this.nodes[node.path()].values.push(val);
  };

  this.nodes[node.path()] = {
    node: node,
    handler: valueHandler,
    values: [ node.value ]
  };

  node.on('value', valueHandler);
};

SubscribeStream.prototype.removeNode = function(node) {
  if(Object.keys(this.nodes).indexOf(node.path()) != -1) {
    var nnode = this.nodes[node.path()];
    nnode.node.removeListener('value', nnode.handler);

    delete this.nodes[node.path()];
    return true;
  }
  return false;
};

module.exports = {
  StreamState: StreamState,
  Stream: Stream,
  SubscribeStream: SubscribeStream
};