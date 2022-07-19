var fs = require('fs');
var path = require('path');
var hbjs = require('./hbjs.js')

module.exports = new Promise(function (resolve, reject) {
  fs.readFile(path.resolve(__dirname, 'hb.wasm'), function (err, data) {
    if (err) { reject(err); return; }
    WebAssembly.instantiate(data).then(function (result) {
      resolve(hbjs(result.instance));
    }, reject);
  });
});
