import { set } from 'lodash'
import _ from 'lodash/fp'
import { Mapper, Options, Node } from './types'

export const isObjectOrArray = _.overSome([_.isPlainObject, _.isArray])
const defTraverse = (x: any) => isObjectOrArray(x) && !_.isEmpty(x) && x

/**
 * Walk an object depth-first in a preorder (default) or
 * postorder manner. Returns an array of nodes.
 */
export const walk = (obj: object, options: Options = {}) => {
  const { postOrder, jsonCompat, traverse = defTraverse } = options
  // A leaf is a node that can't be traversed
  const isLeaf = _.negate(traverse)
  // Recursively walk object
  const _walk = (obj: object, parents: any[], path: string[]) => {
    const nodes: Node[] = []
    for (const [key, val] of Object.entries(obj)) {
      const nodeParents = [obj, ...parents]
      const nodePath = [...path, key]
      const node = {
        key,
        val,
        parents: nodeParents,
        path: nodePath,
        isLeaf: isLeaf(val),
        isRoot: false,
      }
      const next = traverse(val)
      const childNodes = next ? _walk(next, nodeParents, nodePath) : []
      nodes.push(
        // Add child nodes before node for post order
        ...(postOrder ? childNodes : []),
        node,
        // Add child nodes after node for pre order
        ...(!postOrder ? childNodes : [])
      )
    }
    return nodes
  }

  const nodes = _walk(traverse(obj), [], [])
  // Filter the leaves
  if (options.leavesOnly) {
    return _.filter('isLeaf', nodes)
  }

  // Add root node
  const rootCommon = { path: [], isLeaf: false, isRoot: true }
  const root = jsonCompat
    ? { key: '', val: obj, parents: [{ '': obj }], ...rootCommon }
    : { key: undefined, val: obj, parents: [], ...rootCommon }
  if (postOrder) nodes.push(root)
  else nodes.unshift(root)

  return nodes
}

/**
 * Map over an object with a fn depth-first in a preorder (default)
 * or postorder manner. Exclude nodes by returning undefined.
 */
export const map = (obj: object, mapFn: Mapper, options?: Options) => {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const nodes = walk(obj, options)
  // console.dir(nodes, {depth: 10})
  const result = _.isPlainObject(obj) ? {} : []
  for (const node of nodes) {
    const newVal = mapFn(node)
    if (newVal !== undefined) {
      set(result, node.path, newVal)
    }
  }
  return result
}

/**
 * Map over the leaves of an object with a fn. Exclude nodes by returning
 * undefined.
 */
export const mapLeaves = (obj: object, mapFn: Mapper, options?: Options) =>
  map(obj, mapFn, { ...options, leavesOnly: true })
