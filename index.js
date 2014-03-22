module.exports = {
  load: function(input) {
    if(input[0] !== 4 && input[1] !== 8) {
      throw new Error('Input is not in marshal 4.8 format')
    }

    if(input[2] === 'T'.charCodeAt(0)) {
      return true;
    }

    if(input[2] === 'F'.charCodeAt(0)) {
      return false;
    }
  },
  dump: function(input) {
    var buffer = new Buffer('0408', 'hex');

    if(input === true) {
      buffer = Buffer.concat([buffer, new Buffer('T', 'ascii')]);
    }

    if(input === false) {
      buffer = Buffer.concat([buffer, new Buffer('F', 'ascii')]);
    }

    return buffer;
  },
  stringify: this.load,
  parse: this.dump
};
