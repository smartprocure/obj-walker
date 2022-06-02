import { decycle, retrocycle } from 'json-decycle'
import _ from 'lodash/fp'
import { walk, map } from './walker'
import { Node, RefOptions } from './types'

/**
 *
 */
export const addRefs = (obj: object, options?: RefOptions) => {
  const fn = decycle()
  const mapper = ({ key, val, parents }: Node) =>
    fn.call(parents[0], key ?? '', val)

  return map(obj, mapper, { ...options, jsonCompat: true })
}

/**
 *
 */
export const deref = (obj: object, options?: RefOptions) => {
  const fn = retrocycle()
  const clonedObj = _.cloneDeep(obj)
  walk(clonedObj, { ...options, postOrder: true, jsonCompat: true }).forEach(
    ({ parents, key, val }) => {
      fn.call(parents[0], key ?? '', val)
    }
  )
  return clonedObj
}
