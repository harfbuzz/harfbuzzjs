import hbjs from './hbjs.mjs';
import hb from './hb.mjs';
const wasmURL = new URL('./hb.wasm', import.meta.url);

async function getHarfbuzz() {
    function locateFile(/*path, prefix*/) {
        return wasmURL.toString();
    }
    const Module = await hb({locateFile});
    const hbjsInstance = hbjs(Module);
    // Add Module for low level api access.
    hbjsInstance.Module = Module;
    return hbjsInstance;
}

export default getHarfbuzz;
