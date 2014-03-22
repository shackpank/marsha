module.exports = {
  leader: 'i'.charCodeAt(0),
  load: function(buffer) {
    switch(buffer.length) {
      case 1:
        if(buffer[0] === 0) return 0;
        var num = buffer.readInt8(0);

        if(num > 0) {
          num -= 5;
        } else {
          num += 5;
        }

        return num;
      case 2:
        var num = buffer.readUInt8(1);
        if(buffer[0] === 255) {
          num = -(256 - num);
        }
        return num;
      case 3:
        return buffer.readInt16LE(1)
      case 4:
      case 5:
        return buffer.readInt32LE(1)
    }
  },
  identifySlice: function(buffer, offset) {
    switch(buffer[offset]) {
      case 4:
      case 252:
        return buffer.slice(offset, offset + 5);
      case 3:
      case 253:
        return buffer.slice(offset, offset + 4);
      case 2:
      case 254:
        return buffer.slice(offset, offset + 3);
      case 1:
      case 255:
        return buffer.slice(offset, offset + 2);
      case 0:
      default:
        return buffer.slice(offset, offset + 1);
    }
  },
  dump: function(input) {
    var buffer = new Buffer([this.leader]);

    if(input === 0) {
      buffer = Buffer.concat([buffer, new Buffer([0])]);
    } else if(input > 0) {
      if(input < 123) {
        buffer = Buffer.concat([buffer, new Buffer([input + 5])]);
      } else if(input < 256) {
        buffer = Buffer.concat([buffer, new Buffer([1, input])]);
      } else {
        var uint = new Buffer(2);
        uint.writeUInt16LE(input, 0);
        buffer = Buffer.concat([buffer, new Buffer([2]), uint]);
      }
    } else {
      if(input > -124) {
        buffer = Buffer.concat([buffer, new Buffer([input - 5])]);
      } else if(input > -257) {
        buffer = Buffer.concat([buffer, new Buffer([255, input])]);
      } else {
        var uint = new Buffer(2);
        uint.writeUInt16LE(65536 - Math.abs(input), 0);
        buffer = Buffer.concat([buffer, new Buffer([254]), uint]);
      }
    }

    return buffer;
  }
};
