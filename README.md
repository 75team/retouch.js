retouch.js
==========

The retouch pattern of JavaScript

## Usage

'''bash

npm install retouch

'''

'''js

var r = require('retouch');

var MyHelper = {
  double : function(x){
    return x*2;
  }
}

var retouched = r.exec(MyHelper);

r.mixin(Number.prototype, retouched);

console.log(2.0.double());

'''
