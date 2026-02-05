import hbjs from '../hbjs.js'
import createHarfBuzz from '../hb.js'

export type {
  HBBlob,
  HBFace,
  HBFont,
  HBBuffer,
  HBHandle,
  HBDir,
  HBFlag,
  HBJson,
  HBVariations,
  SvgPathCommand,
} from './types'

export default createHarfBuzz().then((instance) => {
  return hbjs(instance)
})
