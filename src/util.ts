import _ from 'lodash/fp'
import { Node } from './types'

/**
 * Is the value a plain object or an array?
 */
export const isObjectOrArray = _.overSome([_.isPlainObject, _.isArray])

/**
 * Skip if the value is undefined and the node's parent is not array.
 */
export const defShouldSkip = (val: any, node: Node) =>
  val === undefined && !parentIsArray(node)

/**
 * Is the parent of the node an array?
 */
export const parentIsArray = (node: Node) => {
  const parent = node.parents[0]
  return Array.isArray(parent)
}

/**
 * Is the value a non-empty object or array? If yes, then traverse it.
 */
export const defTraverse = (x: any) => isObjectOrArray(x) && !_.isEmpty(x) && x

export const getRoot = (obj: object, jsonCompat = false): Node => {
  const rootCommon = { path: [], isLeaf: false, isRoot: true }
  return jsonCompat
    ? { key: '', val: obj, parents: [{ '': obj }], ...rootCommon }
    : { key: undefined, val: obj, parents: [], ...rootCommon }
}

/**
 * Size in bytes
 */
export const ECMA_SIZES = {
  STRING: 2,
  BOOLEAN: 4,
  BYTES: 4,
  NUMBER: 8,
  Int8Array: 1,
  Uint8Array: 1,
  Uint8ClampedArray: 1,
  Int16Array: 2,
  Uint16Array: 2,
  Int32Array: 4,
  Uint32Array: 4,
  Float32Array: 4,
  Float64Array: 8,
}
