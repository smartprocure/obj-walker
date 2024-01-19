import { set, unset } from 'lodash'
import _ from 'lodash/fp'
import {
  Compact,
  Map,
  Node,
  MapOptions,
  Walk,
  MapInternal,
  FindNode,
  Flatten,
  NextNode,
  CompactOptions,
  Truncate,
  Walkie,
  WalkieAsync,
  Walker,
  MutationOption,
} from './types'
import {
  isObjectOrArray,
  defShouldSkip,
  defTraverse,
  getRoot,
  parentIsArray,
} from './util'

const nextNode: NextNode = (currentNode, entry, isLeaf) => {
  const [key, val] = entry
  const { val: currentVal, parents, path } = currentNode
  const nodeParents = [currentVal, ...parents]
  const nodePath = [...path, key]
  return {
    key,
    val,
    parents: nodeParents,
    path: nodePath,
    isLeaf: isLeaf(val),
    isRoot: false,
  }
}

export const SHORT_CIRCUIT = Symbol('SHORT_CIRCUIT')

const shouldShortCircuit = (x: any) => x === SHORT_CIRCUIT

/**
 * Walk an object depth-first in a preorder (default) or postorder manner.
 * Call walkFn for each node visited. Supports traversing the object in
 * arbitrary ways by passing a traverse fn in options. Short circuit traversal
 * by returning the exported symbol `SHORT_CIRCUIT`.
 *
 * Note: this is a low-level function and probably isn't what you want.
 */
export const walker: Walker = (obj, walkFn, options = {}) => {
  let shortCircuit = false
  const { postOrder, jsonCompat, traverse = defTraverse } = options
  // A leaf is a node that can't be traversed
  const isLeaf = _.negate(traverse)
  // Recursively walk object
  const _walk = (node: Node): void => {
    if (shortCircuit) return
    // Preorder
    if (!postOrder) {
      if (shouldShortCircuit(walkFn(node))) {
        shortCircuit = true
        return
      }
    }
    const { val } = node
    const next = traverse(val) || []
    for (const entry of Object.entries(next)) {
      _walk(nextNode(node, entry, isLeaf))
    }
    // Postorder
    if (postOrder) {
      if (shouldShortCircuit(walkFn(node))) {
        shortCircuit = true
        return
      }
    }
  }

  _walk(getRoot(obj, jsonCompat))
}

const mapPre: MapInternal = (obj, mapper, options) => {
  const traverse = defTraverse
  const { jsonCompat, shouldSkip } = options
  // A leaf is a node that can't be traversed
  const isLeaf = _.negate(traverse)
  // Recursively walk object
  const _walk = (node: Node): void => {
    const { isRoot, path } = node
    const newVal = mapper(node)
    // Should skip value
    if (shouldSkip(newVal, node)) {
      unset(obj, path)
      return
    }
    if (isRoot) {
      obj = newVal
    } else {
      set(obj, path, newVal)
    }
    const next = traverse(newVal) || []
    for (const entry of Object.entries(next)) {
      _walk(nextNode(node, entry, isLeaf))
    }
  }
  _walk(getRoot(obj, jsonCompat))
  return obj
}

const mapPost: MapInternal = (obj, mapper, options) => {
  walker(
    obj,
    (node) => {
      const { isRoot, path } = node
      const newVal = mapper(node)
      // Should skip value
      if (options.shouldSkip(newVal, node)) {
        unset(obj, path)
        return
      }
      if (isRoot) {
        obj = newVal
      } else {
        set(obj, path, newVal)
      }
    },
    { ...options, postOrder: true }
  )
  return obj
}

const setMapDefaults = (options: MapOptions & MutationOption) => ({
  postOrder: options.postOrder ?? false,
  jsonCompat: options.jsonCompat ?? false,
  modifyInPlace: options.modifyInPlace ?? false,
  shouldSkip: options.shouldSkip ?? defShouldSkip,
})

/**
 * Map over an object modifying values with a fn depth-first in a
 * preorder or postorder manner. The output of the mapper fn
 * will be traversed if possible when traversing preorder.
 *
 * By default, nodes will be excluded by returning `undefined`.
 * Undefined array values will not be excluded. To customize
 * pass a fn for `options.shouldSkip`.
 */
export const map: Map = (obj, mapper, options = {}) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const opts = setMapDefaults(options)
  if (!opts.modifyInPlace) {
    obj = _.cloneDeep(obj)
  }
  if (options.postOrder) {
    return mapPost(obj, mapper, opts)
  }
  return mapPre(obj, mapper, opts)
}

/**
 * Walk an object depth-first in a preorder (default) or
 * postorder manner. Returns an array of nodes.
 */
export const walk: Walk = (obj, options = {}) => {
  const nodes: Node[] = []
  const walkFn = (node: Node) => {
    nodes.push(node)
  }
  walker(obj, walkFn, options)
  // Filter the leaves
  if (options.leavesOnly) {
    return _.filter('isLeaf', nodes)
  }
  return nodes
}

/**
 * Walk-each ~ walkie
 *
 * Walk over an object calling `walkFn` for each node. The original
 * object is deep-cloned by default making it possible to simply mutate each
 * node as needed in order to transform the object. The cloned object
 * is returned if `options.modifyInPlace` is not set to true.
 */
export const walkie: Walkie = (obj, walkFn, options = {}) => {
  if (!options.modifyInPlace) {
    obj = _.cloneDeep(obj)
  }
  walk(obj, options).forEach(walkFn)
  return obj
}

/**
 * Like `walkie` but awaits the promise returned by `walkFn` before proceeding to
 * the next node.
 */
export const walkieAsync: WalkieAsync = async (obj, walkFn, options = {}) => {
  if (!options.modifyInPlace) {
    obj = _.cloneDeep(obj)
  }
  const nodes = walk(obj, options)
  for (const node of nodes) {
    await walkFn(node)
  }
  return obj
}

/**
 * Map over the leaves of an object with a fn. By default, nodes will be excluded
 * by returning `undefined`. Undefined array values will not be excluded. To customize
 * pass a fn for `options.shouldSkip`.
 */
export const mapLeaves: Map = (obj, mapper, options = {}) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const opts = setMapDefaults(options)
  const nodes = walk(obj, { ...opts, leavesOnly: true })
  if (!opts.modifyInPlace) {
    obj = _.isPlainObject(obj) ? {} : []
  }
  for (const node of nodes) {
    const newVal = mapper(node)
    // Should skip value
    if (opts.shouldSkip(newVal, node)) {
      continue
    }
    set(obj, node.path, newVal)
  }
  return obj
}

/**
 * Search for a node and short-circuit the traversal if it's found.
 */
export const findNode: FindNode = (obj, findFn, options = {}) => {
  let node: Node | undefined
  const walkFn = (n: Node) => {
    if (findFn(n)) {
      node = n
      return SHORT_CIRCUIT
    }
  }
  walker(obj, walkFn, options)
  return node
}

/**
 * Flatten an object's keys. Optionally pass `separator` to determine
 * what character to join keys with. Defaults to '.'.
 */
export const flatten: Flatten = (obj, options = {}) => {
  const nodes = walk(obj, { ...options, leavesOnly: true })
  const separator = options?.separator || '.'
  const result: Record<string, any> = {}
  for (const node of nodes) {
    result[node.path.join(separator)] = node.val
  }
  return result
}

const buildCompactFilter = (options: CompactOptions) => {
  const fns: ((x: any) => boolean)[] = []

  if (options.removeUndefined) {
    fns.push(_.isUndefined)
  }
  if (options.removeNull) {
    fns.push(_.isNull)
  }
  if (options.removeEmptyString) {
    fns.push((x: any) => x === '')
  }
  if (options.removeFalse) {
    fns.push((x: any) => x === false)
  }
  if (options.removeNaN) {
    fns.push(_.isNaN)
  }
  if (options.removeEmptyObject) {
    fns.push(_.overEvery([_.isPlainObject, _.isEmpty]))
  }
  if (options.removeEmptyArray) {
    fns.push(_.overEvery([_.isArray, _.isEmpty]))
  }
  return _.overSome(fns)
}

/**
 * Compact an object, removing fields recursively according to the supplied options.
 * All option flags are `false` by default. If `compactArrays` is set to `true`, arrays
 * will be compacted based on the enabled 'remove' option flags.
 */
export const compact: Compact = (obj, options) => {
  const remove = buildCompactFilter(options)
  const mapper = (node: Node) => {
    let { val } = node
    if (options.compactArrays && Array.isArray(val)) {
      val = _.remove(remove, val)
    }
    if (parentIsArray(node) || !remove(val)) {
      return val
    }
  }
  return map(obj, mapper, { ...options, postOrder: true })
}

/**
 * Truncate an object replacing nested objects at depth greater
 * than the max specified depth with `replaceWith`. Replace text Defaults
 * to `[Truncated]`.
 *
 * Note: For the best performance you should consider setting `modifyInPlace`
 * to `true`.
 *
 * Inspiration: https://github.com/runk/dtrim
 */
export const truncate: Truncate = (obj, options) => {
  const depth = options.depth
  const stringLength = options.stringLength || Infinity
  const arrayLength = options.arrayLength || Infinity
  const replaceWith =
    'replaceWith' in options ? options.replaceWith : '[Truncated]'
  return map(
    obj,
    (node) => {
      const { path, val, isLeaf } = node
      // Max depth reached
      if (!isLeaf && path.length === depth) {
        return replaceWith
      }
      // Transform Error to plain object
      if (val instanceof Error) {
        return {
          message: val.message,
          name: val.name,
          ...(val.stack && { stack: val.stack }),
          ..._.toPlainObject(val),
        }
      }
      // String exceeds max length
      if (typeof val === 'string' && val.length > stringLength) {
        return `${val.slice(0, stringLength)}...`
      }
      // Array exceeds max length
      if (Array.isArray(val) && val.length > arrayLength) {
        return val.slice(0, arrayLength)
      }
      return val
    },
    options
  )
}
