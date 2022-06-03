import { decycle, retrocycle } from 'json-decycle'
import { walkie, map } from './walker'
import { Node, RefOptions } from './types'

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
  return walkie(obj, walkFn, { ...options, postOrder: true, jsonCompat: true })
}
