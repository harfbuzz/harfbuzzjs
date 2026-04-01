import createHarfBuzz from './hb.js';
import * as hbjs from './hbjs';

export default createHarfBuzz().then((module) => {
  hbjs.init(module);
  return hbjs;
});
