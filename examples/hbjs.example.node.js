var fs = require('fs');
var example = require('./hbjs.example.js');
var hbjs = require('../hbjs.js')

require('../harfbuzzjs.js')().then(module => {
  console.log(example(hbjs(module), fs.readFileSync('/usr/share/fonts/TTF/DejaVuSans.ttf')));
});