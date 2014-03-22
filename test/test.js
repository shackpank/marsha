var marsha = require('../');
var assert = require('assert');
var fs = require('fs');
var cases = JSON.parse(fs.readFileSync('./test/examples.json'));

describe('marsha', function() {
  it('expects 4.8 as the initial bytes', function() {
    assert.throws(function() {
      marsha.load('');
    }, /input is not in marshal 4\.8 format/i, 'input with invalid leading bytes should throw')
  });

  Object.keys(cases).forEach(function(base64) {
    it('unserializes "' + base64 + '" to ' + JSON.stringify(cases[base64]), function() {
      var buffer = new Buffer(base64, 'base64');
      assert.deepEqual(marsha.load(buffer), cases[base64]);
    });

    it('serializes "' + JSON.stringify(cases[base64]) + '" to ' + base64, function() {
      var buffer = marsha.dump(cases[base64]);
      assert.equal(buffer.toString('base64'), base64);
    });
  });
});
