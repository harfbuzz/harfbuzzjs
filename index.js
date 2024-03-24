var hbjs = require('./hbjs.js');
var hb = require('./hb.js');

module.exports = new Promise(function (resolve, reject) {
  hb().then((instance) => {
    resolve(hbjs(instance));
  }, reject);
});
