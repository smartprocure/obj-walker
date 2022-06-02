import { set, unset } from 'lodash'
import _ from 'lodash/fp'
import { WalkFn, Mapper, MapperKV, Options, Node } from './types'

export const isObjectOrArray = _.overSome([_.isPlainObject, _.isArray])
const defTraverse = (x: any) => isObjectOrArray(x) && !_.isEmpty(x) && x

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

  const rootCommon = { path: [], isLeaf: false, isRoot: true }
  const root = jsonCompat
    ? { key: '', val: obj, parents: [{ '': obj }], ...rootCommon }
    : { key: undefined, val: obj, parents: [], ...rootCommon }

  _walk(root)
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
 * Map over an object modifying values with a fn depth-first in a
 * preorder (default) or postorder manner. Exclude nodes by returning
 * undefined.
 */
export const map = (obj: object, mapper: Mapper, options?: Options) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const nodes = walk(obj, options)
  // console.dir(nodes, { depth: 10 })
  const result = _.isPlainObject(obj) ? {} : []
  for (const node of nodes) {
    const newVal = mapper(node)
    if (newVal !== undefined) {
      set(result, node.path, newVal)
    }
  }
  return result
}

/**
 * Map over an object modifying keys and values with a fn depth-first in
 * a preorder (default) or postorder manner. Exclude nodes by returning
 * undefined.
 */
export const mapKV = (obj: object, mapper: MapperKV, options?: Options) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const nodes = walk(obj, options)
  const result = _.isPlainObject(obj) ? {} : []
  for (const node of nodes) {
    const newKV = mapper(node)
    if (newKV !== undefined) {
      const path = node.path
      const [key, val] = newKV
      // Remove old path
      unset(result, path)
      if (key !== undefined) {
        // New path
        path[path.length - 1] = key
        // Set val for new path
        set(result, path, val)
      }
    }
  }
  return result
}

/**
 * Map over the leaves of an object with a fn. Exclude nodes by returning
 * undefined.
 */
export const mapLeaves = (obj: object, mapper: Mapper, options?: Options) =>
  map(obj, mapper, { ...options, leavesOnly: true })
