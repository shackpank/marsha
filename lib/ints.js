module.exports = {
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
        var num = buffer.readUInt16LE(1);
        if(buffer[0] === 254) {
          num = -(65536 - num);
        }
        return num;
      case 4:
        var tmpBuffer = Buffer.concat([buffer.slice(1), new Buffer([0])]);
        var num = tmpBuffer.readInt32LE(0);
        if(buffer[0] === 253) {
          num = -(16777216 - num);
        }
        return num;
      case 5:
        return buffer.readInt32LE(1);
      default: throw new Error('This is not an int')
    }
  },
  length: function(initialByte) {
    switch(initialByte) {
      case 4:
      case 252:
        return 5;
      case 3:
      case 253:
        return 4;
      case 2:
      case 254:
        return 3;
      case 1:
      case 255:
        return 2;
      case 0:
      default:
        return 1;
    }
  },
  dump: function(input) {
    if(input === 0) return new Buffer([0]);

    if(input > 0) {
      if(input < 123) {
        return new Buffer([input + 5]);
      } else if(input < 256) {
        return new Buffer([1, input]);
      } else if(input < 65536) {
        var uint = new Buffer(2);
        uint.writeUInt16LE(input, 0);
        return Buffer.concat([new Buffer([2]), uint]);
      } else if (input < 16777216) {
        var uint = new Buffer(4);
        uint.writeUInt32LE(input, 0);
        return Buffer.concat([new Buffer([3]), uint.slice(0, uint.length -1)]);
      } else {
        var uint = new Buffer(4);
        uint.writeUInt32LE(input, 0)
        return Buffer.concat([new Buffer([4]), uint]);
      }
    } else {
      if(input > -124) {
        return Buffer.concat([new Buffer([input - 5])]);
      } else if(input > -257) {
        return Buffer.concat([new Buffer([255, input])]);
      } else if(input > -65537) {
        var uint = new Buffer(2);
        uint.writeUInt16LE(65536 - Math.abs(input), 0);
        return Buffer.concat([new Buffer([254]), uint]);
      } else if (input > -16777217) {
        var uint = new Buffer(4);
        uint.writeUInt32LE(16777216 - Math.abs(input), 0);
        return Buffer.concat([new Buffer([253]), uint.slice(0, uint.length -1)]);
      } else {
        var uint = new Buffer(4);
        uint.writeUInt32LE(4294967296 - Math.abs(input), 0);
        return Buffer.concat([new Buffer([252]), uint]);
      }
    }
  }
};
