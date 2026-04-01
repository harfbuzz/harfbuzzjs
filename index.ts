import createHarfBuzz from './hb.js';
import hbjs from './hbjs';

const harfbuzz = createHarfBuzz().then((instance) => hbjs(instance));
export default harfbuzz;
