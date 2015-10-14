var marsha = require('../');
var assert = require('assert');
var fs = require('fs');
var bigInt = require('big-integer');
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

    it('parses Bignum', function() {
      var buffer = new Buffer('04086c2b0968a0bf5909934051', 'hex');
      assert.ok(marsha.load(buffer).equals(bigInt("5854841183951364200")));
    });

    it('parses negative Bignum', function() {
      var buffer = new Buffer('04086c2d09fcecf6f9944a2b6a', 'hex');
      assert.ok(marsha.load(buffer).equals(bigInt("-7650290395728243964")));
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

    xit('outputs Bignum', function() {
      var buffer = marsha.dump(bigInt("5854841183951364200"));
      assert.equal(buffer.toString('hex'), '04086c2b0968a0bf5909934051');
    });

    xit('outputs negative Bignum', function() {
      var buffer = marsha.dump(bigInt("-7650290395728243964"));
      assert.equal(buffer.toString('hex'), '04086c2d09fcecf6f9944a2b6a');
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
