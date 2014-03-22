var MARSHAL_TRUE = 'T'.charCodeAt(0);
var MARSHAL_FALSE = 'F'.charCodeAt(0);
var MARSHAL_NULL = '0'.charCodeAt(0);

var ints = require('./lib/ints');

var _identifyNextToken = function(buffer, offset, output) {
  if(offset >= buffer.length) return output;

  if(buffer[offset] === MARSHAL_TRUE) {
    return _identifyNextToken(buffer, offset + 1, true);
  } else if(buffer[offset] === MARSHAL_FALSE) {
    return _identifyNextToken(buffer, offset + 1, false);
  } else if(buffer[offset] === MARSHAL_NULL) {
    return _identifyNextToken(buffer, offset + 1, null);
  } else if(buffer[offset] === ints.leader) {
    var slice = ints.identifySlice(buffer, offset + 1);
    var value = ints.load(slice);
    return _identifyNextToken(buffer, offset + 1 + slice.length, value);
  } else {
    console.error(buffer, offset)
    throw new Error('i dont know what this is')
  }
};

module.exports = {
  load: function(input, encoding) {
    if(!(input instanceof Buffer)) {
      if(!encoding) {
        throw new Error('A second "encoding" argument is expected if the first argument is not a buffer');
      }

      input = new Buffer(input, encoding);
    }

    if(input[0] !== 4 && input[1] !== 8) {
      throw new Error('Input is not in marshal 4.8 format')
    }

    return _identifyNextToken(input, 2);
  },
  dump: function(input, encoding) {
    var buffer = new Buffer('0408', 'hex');

    if(input === true) {
      buffer = Buffer.concat([buffer, new Buffer('T', 'ascii')]);
    }

    if(input === false) {
      buffer = Buffer.concat([buffer, new Buffer('F', 'ascii')]);
    }

    if(input === null) {
      buffer = Buffer.concat([buffer, new Buffer([MARSHAL_NULL])]);
    }

    if(typeof input === 'number') {
      buffer = Buffer.concat([buffer, ints.dump(input)]);
    }

    if(encoding) {
      return buffer.toString(encoding);
    }
    return buffer;
  }
};
