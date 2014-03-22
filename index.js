var MARSHAL_TRUE = 'T'.charCodeAt(0);
var MARSHAL_FALSE = 'F'.charCodeAt(0);
var MARSHAL_NULL = '0'.charCodeAt(0);
var MARSHAL_ARRAY = '['.charCodeAt(0);
var MARSHAL_INT = 'i'.charCodeAt(0);
var MARSHAL_SYM = ':'.charCodeAt(0);

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
        offset += length + 1;
        return ints.load(slice);
      case MARSHAL_SYM:
        var length = ints.load(buffer.slice(offset + 1, offset + 2));
        var tempBuf = buffer.slice(offset + 2, offset + 2 + length);
        return tempBuf.toString('utf8');
      case MARSHAL_ARRAY:
        var tokensExpected = ints.load(buffer.slice(offset + 1, offset + 2));
        var elements = [];
        offset += 2;
        for(var i = 0; i < tokensExpected; i++) {
          elements.push(_identifyNextToken());
        }
        return elements;
      default:
        throw new Error('Unexpected item in bagging area, offset ' + offset + ' on ' + buffer);
    }

    return output;
  }

  return _identifyNextToken();
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
