var MARSHAL_TRUE = 'T'.charCodeAt(0);
var MARSHAL_FALSE = 'F'.charCodeAt(0);
var MARSHAL_NULL = '0'.charCodeAt(0);
var MARSHAL_ARRAY = '['.charCodeAt(0);
var MARSHAL_HASH = '{'.charCodeAt(0);
var MARSHAL_INT = 'i'.charCodeAt(0);
var MARSHAL_SYM = ':'.charCodeAt(0);
var MARSHAL_SYM_REF = ';'.charCodeAt(0);
var MARSHAL_INSTANCEVAR = 'I'.charCodeAt(0);
var MARSHAL_IVAR_STR = '"'.charCodeAt(0);
var MARSHAL_FLOAT = 'f'.charCodeAt(0);

var ints = require('./lib/ints');

var _parse = function(buffer) {
  var offset = 0;
  var symbols = [];

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
      case MARSHAL_FLOAT:
        var length = ints.load(buffer.slice(offset + 1, offset + 2));
        var tempBuf = buffer.slice(offset + 2, offset + 2 + length);
        offset += length + 2;
        if(tempBuf.toString('utf8') === 'inf') return Infinity;
        if(tempBuf.toString('utf8') === '-inf') return -Infinity;
        return parseFloat(tempBuf.toString('utf8'));
      case MARSHAL_SYM:
        var length = ints.load(buffer.slice(offset + 1, offset + 2));
        var tempBuf = buffer.slice(offset + 2, offset + 2 + length);
        offset += length + 2;
        var sym = tempBuf.toString('utf8');
        symbols.push(sym);
        return sym;
      case MARSHAL_SYM_REF:
        var index = ints.load(buffer.slice(offset + 1, offset + 2));
        offset += 2;
        return symbols[index];
      case MARSHAL_INSTANCEVAR:
        var ivarType = buffer[offset + 1];
        switch(ivarType) {
          case MARSHAL_IVAR_STR:
            var length = ints.load(buffer.slice(offset + 2, offset + 3));
            var tempBuf = buffer.slice(offset + 3, offset + 3 + length);
            // Move offset forward by the string length, plus the
            // I, " and byte indicating string length
            offset += tempBuf.length + 3;
            if(buffer[offset + 1] === MARSHAL_SYM) {
              // This is the encoding of the string. We're ignoring it, but
              // need to fast-forward past the number of bytes it takes up
              offset += 5;
            } else if(buffer[offset + 1] === MARSHAL_SYM_REF) {
              offset += 4;
            } else {
              throw new Error('String not terminated with encoding symbol (expected 3a or 3b, got ' + buffer[offset + 1].toString(16) + '), not sure what to do');
            }
            return tempBuf.toString('utf8');
          default:
            throw new Error('Unrecognised instance variable type (instance variables currently can only be strings)');
        }
        throw new Error(ivarType);
      case MARSHAL_ARRAY:
        var tokensExpected = ints.load(buffer.slice(offset + 1, offset + 2));
        var elements = [];
        offset += 2;
        for(var i = 0; i < tokensExpected; i++) {
          elements.push(_identifyNextToken());
        }
        return elements;
      case MARSHAL_HASH:
        var tokensExpected = ints.load(buffer.slice(offset + 1, offset + 2)) * 2;
        var hashOut = {};
        offset += 2;
        for(var i = 0; i < tokensExpected; i += 2) {
          var key = _identifyNextToken();
          var val = _identifyNextToken();
          hashOut[key] = val;
        }
        return hashOut;
        break;
      default:
        throw new Error('Unexpected data, value ' + buffer[offset] + ' at offset ' + offset + ' on ' + buffer.toString('hex') + '. Parsing this sort of data is probably not yet implemented!');
    }

    return output;
  }

  return _identifyNextToken();
};

var _dump = function(value) {
  // The first time a string is output it includes a symbol;
  // the second string output needs to refer back to that
  // symbol rather than outputing it again.
  var stringEncodingOffset;

  var _dumpValue = function(value) {
    var _ivar = function(type, value) {
      var trail;

      if(stringEncodingOffset) {
        trail = new Buffer([6, MARSHAL_SYM_REF, 00, 84]);
      } else {
        trail = new Buffer([6, MARSHAL_SYM, 06, 69, 84]);
        stringEncodingOffset = true;
      }

      return Buffer.concat([
        new Buffer([MARSHAL_INSTANCEVAR]),
        new Buffer([type]),
        new Buffer([value.length + 5]),
        new Buffer(value, 'utf8'),
        trail
      ]);
    };

    if(value === true) return new Buffer([MARSHAL_TRUE]);
    if(value === false) return new Buffer([MARSHAL_FALSE]);

    if(typeof value === 'number') {
      if(value === Math.round(value)) {
        if(value === Infinity) {
          var str = 'inf';
          return Buffer.concat([
            new Buffer([MARSHAL_FLOAT]), ints.dump(str.length), new Buffer(str, 'utf8')
          ]);
        } else if(value === -Infinity) {
          var str = '-inf';
          return Buffer.concat([
            new Buffer([MARSHAL_FLOAT]), ints.dump(str.length), new Buffer(str, 'utf8')
          ]);
        } else {
          return Buffer.concat([
            new Buffer([MARSHAL_INT]), ints.dump(value)
          ]);
        }
      } else {
        var str = value.toString();
        return Buffer.concat([
          new Buffer([MARSHAL_FLOAT]), ints.dump(str.length), new Buffer(str, 'utf8')
        ]);
      }
    }

    if(typeof value === 'string') {
      return _ivar(MARSHAL_IVAR_STR, value);
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

    if(value === Object(value)) {
      return Buffer.concat(
        [ new Buffer([MARSHAL_HASH]),
          ints.dump(Object.keys(value).length)
        ].concat(
          [].concat.apply([], Object.keys(value).map(function(key) {
            return [ _dumpValue(key), _dumpValue(value[key]) ];
          }))
        )
      );
    }

    return new Buffer([MARSHAL_NULL]);
  };

  return _dumpValue(value);
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
    buffer = Buffer.concat([buffer, _dump(input)]);
    if(encoding) {
      return buffer.toString(encoding);
    }
    return buffer;
  }
};
