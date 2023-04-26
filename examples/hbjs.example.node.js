var fs = require('fs');
var path = require('path');
var example = require('./hbjs.example.js');

require('../').then(function (hbjs) {
  console.log(example(hbjs, new Uint8Array(fs.readFileSync(path.resolve(__dirname, '../test/fonts/noto/NotoSans-Regular.ttf')))));
  console.log(example(hbjs, new Uint8Array(fs.readFileSync(path.resolve(__dirname, '../test/fonts/noto/NotoSansArabic-Variable.ttf'))), "أبجد"));
}, console.log);
