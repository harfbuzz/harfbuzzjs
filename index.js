/** @typedef {import('./types').HBHandle} HBHandle */

var hbjs = require('./hbjs.js');
var hb = require('./hb.js');

/** @type {Promise<HBHandle>} */
module.exports = new Promise(function (resolve, reject) {
  hb().then((instance) => {
    resolve(hbjs(instance));
  }, reject);
});
