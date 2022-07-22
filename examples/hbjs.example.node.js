var fs = require('fs');
var path = require('path');
var example = require('./hbjs.example.js');

require('../').then(function (hbjs) {
  console.log(example(hbjs, new Uint8Array(fs.readFileSync(path.resolve(__dirname, 'Roboto.abc.ttf')))));
  console.log(example(hbjs, new Uint8Array(fs.readFileSync(path.resolve(__dirname, 'Roboto-Black.ttf')))));
}, console.log);
