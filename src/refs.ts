import { decycle, retrocycle } from 'json-decycle'

import { Node, RefOptions } from './types'
import { map, walkEach } from './walker'

/**
 * Replace duplicate objects refs with pointers to the first
 * object seen.
 */
export const addRefs = (obj: object, options?: RefOptions) => {
  const fn = decycle()
  const mapper = ({ key, val, parents }: Node) =>
    fn.call(parents[0], key ?? '', val)

  return map(obj, mapper, { ...options, jsonCompat: true })
}

/**
 * Rehydrate objects by replacing refs with actual objects.
 */
export const deref = (obj: object, options?: RefOptions) => {
  const fn = retrocycle()
  const walkFn = ({ parents, key, val }: Node) => {
    fn.call(parents[0], key ?? '', val)
  }
  return walkEach(obj, walkFn, {
    ...options,
    postOrder: true,
    jsonCompat: true,
  })
}
