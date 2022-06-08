import { set, unset } from 'lodash'
import _ from 'lodash/fp'
import {
  WalkFn,
  Map,
  Options,
  Node,
  MapOptions,
  WalkOptions,
  MapInternal,
} from './types'

export const isObjectOrArray = _.overSome([_.isPlainObject, _.isArray])

export const parentIsArray = (node: Node) => {
  const parent = node.parents[0]
  return Array.isArray(parent)
}

const getRoot = (obj: object, jsonCompat = false): Node => {
  const rootCommon = { path: [], isLeaf: false, isRoot: true }
  return jsonCompat
    ? { key: '', val: obj, parents: [{ '': obj }], ...rootCommon }
    : { key: undefined, val: obj, parents: [], ...rootCommon }
}

const defTraverse = (x: any) => isObjectOrArray(x) && !_.isEmpty(x) && x

const defShouldSkip = (val: any, node: Node) =>
  val === undefined && !parentIsArray(node)

/**
 * Walk an object depth-first in a preorder (default) or postorder manner.
 * Call walkFn for each node visited. Supports traversing the object in
 * arbitrary ways by passing a traverse fn in options.
 */
export const walker = (obj: object, walkFn: WalkFn, options: Options = {}) => {
  const { postOrder, jsonCompat, traverse = defTraverse } = options
  // A leaf is a node that can't be traversed
  const isLeaf = _.negate(traverse)
  // Recursively walk object
  const _walk = (node: Node): void => {
    // Preorder
    if (!postOrder) {
      walkFn(node)
    }
    const { val: tree, parents, path } = node
    const next = traverse(tree) || []
    for (const [key, val] of Object.entries(next)) {
      const nodeParents = [tree, ...parents]
      const nodePath = [...path, key]
      const node = {
        key,
        val,
        parents: nodeParents,
        path: nodePath,
        isLeaf: isLeaf(val),
        isRoot: false,
      }
      _walk(node)
    }
    // Postorder
    if (postOrder) {
      walkFn(node)
    }
  }

  const root = getRoot(obj, jsonCompat)
  _walk(root)
}

const mapPre: MapInternal = (obj, mapper, options) => {
  const { jsonCompat, traverse, shouldSkip } = options
  // A leaf is a node that can't be traversed
  const isLeaf = _.negate(traverse)
  // Recursively walk object
  const _walk = (node: Node): void => {
    const { parents, path } = node
    const newVal = mapper(node)
    // Should skip value
    if (shouldSkip(newVal, node)) {
      unset(obj, path)
      return
    }
    set(obj, path, newVal)
    const next = traverse(newVal) || []
    for (const [key, val] of Object.entries(next)) {
      const nodeParents = [newVal, ...parents]
      const nodePath = [...path, key]
      const node = {
        key,
        val,
        parents: nodeParents,
        path: nodePath,
        isLeaf: isLeaf(val),
        isRoot: false,
      }
      _walk(node)
    }
  }
  const root = getRoot(obj, jsonCompat)
  _walk(root)
}

const mapPost: MapInternal = (obj, mapper, options) =>
  walker(
    obj,
    (node) => {
      const { path } = node
      const newVal = mapper(node)
      // Should skip value
      if (options.shouldSkip(newVal, node)) {
        unset(obj, path)
        return
      }
      set(obj, path, newVal)
    },
    { ...options, postOrder: true }
  )

const setMapDefaults = (options: MapOptions) => ({
  postOrder: options.postOrder ?? false,
  jsonCompat: options.jsonCompat ?? false,
  shouldSkip: options.shouldSkip ?? defShouldSkip,
  traverse: options.traverse ?? defTraverse,
})

/**
 * Map over an object modifying values with a fn depth-first in a
 * preorder or postorder manner. The output of the mapper fn
 * will be traversed if possible when traversing preorder.
 *
 * By default, nodes will be excluded by returning undefined.
 * Undefined array values will not be excluded. To customize
 * pass a fn for options.shouldSkip.
 */
export const map: Map = (obj, mapper, options = {}) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const opts = setMapDefaults(options)
  const result = _.cloneDeep(obj)
  if (options.postOrder) {
    mapPost(result, mapper, opts)
  } else {
    mapPre(result, mapper, opts)
  }

  return result
}

/**
 * Walk an object depth-first in a preorder (default) or
 * postorder manner. Returns an array of nodes.
 */
export const walk = (obj: object, options: WalkOptions = {}) => {
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
 * Walk over an object calling walkFn for each node. The original
 * object is deep-cloned making it possible to simply mutate each
 * node as needed in order to transform the object. The cloned object
 * is returned.
 */
export const walkie = (obj: object, walkFn: WalkFn, options?: WalkOptions) => {
  const clonedObj = _.cloneDeep(obj)
  walk(clonedObj, options).forEach(walkFn)
  return clonedObj
}

/**
 * Map over the leaves of an object with a fn. By default, nodes will be excluded
 * by returning undefined. Undefined array values will not be excluded. To customize
 * pass a fn for options.shouldSkip.
 */
export const mapLeaves: Map = (obj, mapper, options = {}) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const opts = setMapDefaults(options)
  const nodes = walk(obj, { ...opts, leavesOnly: true })
  const result = _.isPlainObject(obj) ? {} : []
  for (const node of nodes) {
    const newVal = mapper(node)
    // Should skip value
    if (opts.shouldSkip(newVal, node)) {
      continue
    }
    set(result, node.path, newVal)
  }
  return result
}
