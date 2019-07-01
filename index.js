var fs = require('fs');
var path = require('path');
var hbjs = require('./hbjs.js')

module.exports = new Promise(function (resolve, reject) {
  fs.readFile(path.resolve(__dirname, 'hb.wasm'), function (err, data) {
    if (err) { reject(err); return; }
    WebAssembly.instantiate(data).then(function (result) {
      result.instance.exports.memory.grow(400); // each page is 64kb in size
      resolve(hbjs(result.instance));
    }, reject);
  });
});
