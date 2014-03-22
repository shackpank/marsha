Marsha
======

Read/write simple output from Ruby's [Marshal](http://ruby-doc.org/core-2.1.1/Marshal.html) library.

Usage:
```javascript
var marsha = require('marsha');
```

Marshaled data contains all sorts of nonprintable characters; you can provide it as a buffer:
```javascript
var buffer = fs.readFileSync('./data/marshaled');
marsha.load(buffer);
```

Or you can provide a string and an encoding, a buffer will be created internally.
```
marsha.load('BAhbCGkGaQdpCA==', 'base64'); // returns [ 1, 2, 3 ]
```

The JS representation of the marshaled data will be returned, or an exception will be thrown if it's not usable. Marshal can serialize a wide variety of Ruby objects including instances of builtin and user defined classes, which may not have a JS equivalent.

Writing is similar to reading, returns a buffer if called with one argument:

```javascript
marsha.dump([ 1, 2, 3 ]); // returns <Buffer 04 08 5b 08 69 06 69 07 69 08>
```

or a string if called with two:

```javascript
marsha.dump([ 1, 2, 3 ]); // returns 'BAhbCGkGaQdpCA=='
```

=== Tests

```shell
npm test
```

Most coverage is generated from `test/examples.json`, which contains various hex-encoded outputs from asking Marshal to encode things in irb, and their JS equivalents.