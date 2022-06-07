import { set, unset } from 'lodash'
import _ from 'lodash/fp'
import { WalkFn, Mapper, Options, Node, WalkOptions } from './types'

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

const shouldSkipVal = (val: any, node: Node) =>
  val === undefined && !parentIsArray(node)

const mapPre = (obj: object, mapper: Mapper, options: Options) => {
  const { jsonCompat, traverse = defTraverse } = options
  // A leaf is a node that can't be traversed
  const isLeaf = _.negate(traverse)
  // Recursively walk object
  const _walk = (node: Node): void => {
    const { parents, path } = node
    const newVal = mapper(node)
    // Should skip value
    if (shouldSkipVal(newVal, node)) {
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

const mapPost = (obj: object, mapper: Mapper, options: Options) =>
  walker(
    obj,
    (node) => {
      const { path } = node
      const newVal = mapper(node)
      // Should skip value
      if (shouldSkipVal(newVal, node)) {
        unset(obj, path)
        return
      }
      set(obj, path, newVal)
    },
    { ...options, postOrder: true }
  )

/**
 * Map over an object modifying values with a fn depth-first in a
 * preorder or postorder manner. Exclude nodes by returning undefined.
 * Undefined array values will not be excluded. The output of the mapper fn
 * will be traversed if possible when traversing preorder.
 */
export const map = (obj: object, mapper: Mapper, options: Options = {}) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const result = _.cloneDeep(obj)
  if (options.postOrder) {
    mapPost(result, mapper, options)
  } else {
    mapPre(result, mapper, options)
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
 * Map over the leaves of an object with a fn. Exclude nodes by returning
 * undefined. Undefined array values will not be excluded.
 */
export const mapLeaves = (obj: object, mapper: Mapper, options?: Options) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const nodes = walk(obj, { ...options, leavesOnly: true })
  const result = _.isPlainObject(obj) ? {} : []
  for (const node of nodes) {
    const newVal = mapper(node)
    // Should skip value
    if (shouldSkipVal(newVal, node)) {
      continue
    }
    set(result, node.path, newVal)
  }
  return result
}
