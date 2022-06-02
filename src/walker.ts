import { set } from 'lodash'
import _ from 'lodash/fp'
import { WalkFn, Mapper, MapOptions, Options, Node } from './types'

export const isObjectOrArray = _.overSome([_.isPlainObject, _.isArray])
const defTraverse = (x: any) => isObjectOrArray(x) && !_.isEmpty(x) && x

const getRoot = (obj: object, jsonCompat = false): Node => {
  const rootCommon = { path: [], isLeaf: false, isRoot: true }
  return jsonCompat
    ? { key: '', val: obj, parents: [{ '': obj }], ...rootCommon }
    : { key: undefined, val: obj, parents: [], ...rootCommon }
}

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

/**
 * Map over an object modifying values with a fn depth-first in a
 * preorder manner. Exclude nodes by returning undefined.
 */
export const map = (obj: object, mapper: Mapper, options: MapOptions = {}) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const result = _.isPlainObject(obj) ? {} : []
  const { jsonCompat, traverse = defTraverse } = options
  // A leaf is a node that can't be traversed
  const isLeaf = _.negate(traverse)
  // Recursively walk object
  const _walk = (node: Node): void => {
    let newVal = mapper(node)
    const parent = node.parents?.[0]
    // Set value to null for arrays rather than skipping
    if (newVal === undefined && Array.isArray(parent)) {
      newVal = null
    }
    // Exclude node
    if (newVal === undefined) {
      return
    }
    const { parents, path } = node
    set(result, path, newVal)
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

  return result
}

/**
 * Walk an object depth-first in a preorder (default) or
 * postorder manner. Returns an array of nodes.
 */
export const walk = (obj: object, options: Options = {}) => {
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
 * Map over the leaves of an object with a fn. Exclude nodes by returning
 * undefined.
 */
export const mapLeaves = (obj: object, mapper: Mapper, options?: Options) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const nodes = walk(obj, { ...options, leavesOnly: true })
  const result = _.isPlainObject(obj) ? {} : []
  for (const node of nodes) {
    const parent = node.parents?.[0]
    let newVal = mapper(node)
    // Set value to null for arrays rather than skipping
    if (newVal === undefined && Array.isArray(parent)) {
      newVal = null
    }
    if (newVal !== undefined) {
      set(result, node.path, newVal)
    }
  }
  return result
}
