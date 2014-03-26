Marsha
======

Read/write simple output from Ruby's [Marshal](http://ruby-doc.org/core-2.1.1/Marshal.html) library.

### How simple? I serialize everything with Marshal.dump and want to use it to interop with other langs for some reason

This is not for you. First of all, don't use Marshal for that. And second of all, [no smoking](http://www.imdb.com/title/tt0187664/).

![F----- OFFFF](http://i.imgur.com/gmsDzNb.jpg)

### I want to exchange data with Ruby/Rails apps that store simple values in Marshal format

Now we're talking.

I've done basics like true, false and nil, Fixnums, Floats, strings that just contain ASCII/latin1 chars, arrays and hashes. Coverage of what _can_ be serialized is far from exhaustive.

### OK, That Suits My Needs

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

```javascript
marsha.load('BAhbCGkGaQdpCA==', 'base64'); // returns [ 1, 2, 3 ]
```

The JS representation of the marshaled data will be returned, or an exception will be thrown if it's not usable. Marshal can serialize a wide variety of Ruby objects including instances of builtin and user defined classes, which may not have a JS equivalent. `:symbol`s are treated as strings in JS land.

Writing is similar to reading, returns a buffer if called with one argument:

```javascript
marsha.dump([ 1, 2, 3 ]); // returns <Buffer 04 08 5b 08 69 06 69 07 69 08>
```

or a string if called with two:

```javascript
marsha.dump([ 1, 2, 3 ], 'base64'); // returns 'BAhbCGkGaQdpCA=='
```

### Tests

```shell
npm test
```

Most coverage is generated from `test/examples.json`, which contains various hex-encoded outputs from asking Marshal to encode things in irb, and their JS equivalents.