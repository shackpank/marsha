var MARSHAL_TRUE = 'T'.charCodeAt(0);
var MARSHAL_FALSE = 'F'.charCodeAt(0);
var MARSHAL_NULL = '0'.charCodeAt(0);
var MARSHAL_ARRAY = '['.charCodeAt(0);
var MARSHAL_INT = 'i'.charCodeAt(0);

var ints = require('./lib/ints');

var _parse = function(buffer) {
  var offset = 0;

  var _identifyNextToken = function() {
    var output;

    switch(buffer[offset]) {
      case MARSHAL_TRUE:
        offset += 1;
        return true;
      case MARSHAL_FALSE:
        offset += 1;
        return false;
      case MARSHAL_NULL:
        offset += 1;
        return null;
      case MARSHAL_INT:
        var length = ints.length(buffer[offset + 1]);
        var slice = buffer.slice(offset + 1, offset + 1 + length);
        offset += length;
        return ints.load(slice);
      case MARSHAL_ARRAY:
        var tokensExpected = ints.load(buffer.slice(offset + 1, offset + 2));
        var elements = [];
        offset += 2;
        for(var i = 0; i < tokensExpected; i++) {
          elements.push(_identifyNextToken());
        }
        return elements;
    }

    return output;
  }

  return _identifyNextToken();

  if(buffer[offset] === MARSHAL_TRUE) {
    return _identifyNextToken(buffer, offset + 1, true);
  } else if(buffer[offset] === MARSHAL_FALSE) {
    return _identifyNextToken(buffer, offset + 1, false);
  } else if(buffer[offset] === MARSHAL_NULL) {
    return _identifyNextToken(buffer, offset + 1, null);
  } else if(buffer[offset] === MARSHAL_INT) {
    var slice = ints.identifySlice(buffer, offset + 1);
    var value = ints.load(slice);
    return _identifyNextToken(buffer, offset + 1 + slice.length, value);
  } else if(buffer[offset] === MARSHAL_ARRAY) {
    var tokensExpected = ints.load(buffer.slice(offset + 1, offset + 2));
    var elements = [];
    for(var i = 0; i < tokensExpected; i++) {
      elements.push(_identifyNextToken(buffer, offset + 2));
    }
    return _identifyNextToken(buffer, buffer.length, elements);
  } else {
    console.error(buffer, offset)
    throw new Error('i dont know what this is')
  }
};

var _dumpValue = function(value) {

  if(value === true) return new Buffer([MARSHAL_TRUE]);
  if(value === false) return new Buffer([MARSHAL_FALSE]);

  if(typeof value === 'number') {
    return Buffer.concat([
      new Buffer([MARSHAL_INT]), ints.dump(value)
    ]);
  }

  if(Array.isArray(value)) {
    return Buffer.concat(
      [ new Buffer([MARSHAL_ARRAY]),
        ints.dump(value.length)
      ].concat(
        value.map(function(item) {
          return _dumpValue(item);
        })
      )
    );
  }

  return new Buffer([MARSHAL_NULL]);
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

    return _parse(input.slice(2));
  },
  dump: function(input, encoding) {
    var buffer = new Buffer('0408', 'hex');
    buffer = Buffer.concat([buffer, _dumpValue(input)]);
    if(encoding) {
      return buffer.toString(encoding);
    }
    return buffer;
  }
};
