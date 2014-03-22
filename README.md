Read/write simple output from Ruby's Marshal library.

Limitations:
- no objects or any of that crazy stuff
- numbers can only be floats

How it'll probably work:
```
var marsha = require('marsha')

// as in Ruby library
marsha.load(str)
marsha.dump(str)

// aliases so it's like JSON
marsha.parse(str)
marsha.stringify(str)
```