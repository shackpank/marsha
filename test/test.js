var marsha = require('../');
var assert = require('assert');
var fs = require('fs');
var cases = JSON.parse(fs.readFileSync('./test/bidirectional_examples.json'));
var complexCases = JSON.parse(fs.readFileSync('./test/other_examples.json'));

describe('marsha', function() {
  describe('.load', function() {
    it('expects 4.8 as the initial bytes', function() {
      assert.throws(function() {
        marsha.load(new Buffer('FFFF', 'hex'));
      }, /input is not in marshal 4\.8 format/i, 'input with invalid leading bytes should throw');
    });

    it('allows input to be a string if an encoding is specified', function() {
      assert.strictEqual(marsha.load('BAhU', 'base64'), true);
    });

    it('throws an exception if given a string with no encoding', function() {
      assert.throws(function() {
        marsha.load('BAhU');
      }, /A second "encoding" argument is expected if the first argument is not a buffer/i, 'string input with no encoding should throw');
    });

    it('parses Infinity', function() {
      var buffer = new Buffer('04086608696e66', 'hex');
      assert.strictEqual(marsha.load(buffer), Infinity);
    });

    it('parses -Infinity', function() {
      var buffer = new Buffer('040866092d696e66', 'hex');
      assert.strictEqual(marsha.load(buffer), -Infinity);
    });

    Object.keys(cases).forEach(function(hex) {
      it('unserializes ' + hex + ' to ' + JSON.stringify(cases[hex]), function() {
        var buffer = new Buffer(hex, 'hex');
        assert.deepEqual(marsha.load(buffer), cases[hex]);
      });
    });

    complexCases.forEach(function(testCase) {
      it('unserializes ' + testCase.rbin + ' to ' + JSON.stringify(testCase.node), function() {
        var buffer = new Buffer(testCase.rbin, 'hex');
        assert.deepEqual(marsha.load(buffer), testCase.node);
      });
    });
  });

  describe('.dump', function() {
    it('returns a buffer', function() {
      assert.ok(marsha.dump('BAhU') instanceof Buffer);
    });

    it('outputs a string if an encoding is specified', function() {
      assert.strictEqual(marsha.dump(true, 'base64'), 'BAhU');
    });

    it('outputs Infinity', function() {
      var buffer = marsha.dump(Infinity);
      assert.equal(buffer.toString('hex'), '04086608696e66');
    });

    it('outputs -Infinity', function() {
      var buffer = marsha.dump(-Infinity);
      assert.equal(buffer.toString('hex'), '040866092d696e66');
    });

    Object.keys(cases).forEach(function(hex) {
      it('serializes ' + JSON.stringify(cases[hex]) + ' to ' + hex, function() {
        var buffer = marsha.dump(cases[hex]);
        assert.equal(buffer.toString('hex'), hex);
      });
    });

    complexCases.forEach(function(testCase) {
      it('serializes ' + JSON.stringify(testCase.node) + ' to ' + testCase.rbout, function() {
        var buffer = marsha.dump(testCase.node);
        assert.equal(buffer.toString('hex'), testCase.rbout);
      });
    });
  });
});
