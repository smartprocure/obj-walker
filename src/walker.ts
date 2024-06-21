import { set, unset } from 'lodash'
import _ from 'lodash/fp'
import {
  Compact,
  Node,
  Mapper,
  MapOptions,
  Walk,
  FindNode,
  Flatten,
  NextNode,
  CompactOptions,
  Truncate,
  WalkEach,
  WalkEachAsync,
  Walker,
  MutationOption,
  Unflatten,
  RequiredFields,
} from './types'
import {
  isObjectOrArray,
  defShouldSkip,
  defTraverse,
  getRoot,
  parentIsArray,
  ECMA_SIZES,
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
      }
    }
  }

  _walk(getRoot(obj, jsonCompat))
}

function mapPre<T>(
  obj: object,
  mapper: Mapper<T>,
  options: RequiredFields<MapOptions, 'shouldSkip' | 'jsonCompat'>
) {
  const traverse = defTraverse
  const { jsonCompat, shouldSkip, filterFn } = options
  // A leaf is a node that can't be traversed
  const isLeaf = _.negate(traverse)
  // Recursively walk object
  const _walk = (node: Node): void => {
    const { isRoot, path, val } = node
    const newVal = !filterFn || filterFn(val, node) ? mapper(node) : val
    // Should skip value
    if (shouldSkip(newVal, node)) {
      unset(obj, path)
      return
    }
    if (isRoot) {
      obj = newVal as object
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

function mapPost<T>(
  obj: object,
  mapper: Mapper<T>,
  options: RequiredFields<MapOptions, 'shouldSkip' | 'jsonCompat'>
) {
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
        obj = newVal as unknown as object
      } else {
        set(obj, path, newVal)
      }
    },
    { ...options, postOrder: true }
  )
  return obj
}

function setMapDefaults(options: MapOptions & MutationOption) {
  return {
    ...options,
    postOrder: options.postOrder ?? false,
    jsonCompat: options.jsonCompat ?? false,
    modifyInPlace: options.modifyInPlace ?? false,
    shouldSkip: options.shouldSkip ?? defShouldSkip,
  }
}

/**
 * Map over an object modifying values with a fn depth-first in a
 * preorder or postorder manner. The output of the mapper fn
 * will be traversed if possible when traversing preorder.
 *
 * By default, nodes will be excluded by returning `undefined`.
 * Undefined array values will not be excluded. To customize
 * pass a fn for `options.shouldSkip`.
 */
export function map<T>(
  obj: unknown,
  mapper: Mapper<T>,
  options: MapOptions & MutationOption = {}
) {
  if (!isObjectOrArray(obj)) {
    return obj
  }
  const opts = setMapDefaults(options)
  const newObj = !opts.modifyInPlace ? _.cloneDeep(obj) : obj

  if (options.postOrder) {
    return mapPost<T>(newObj, mapper, opts)
  }
  return mapPre<T>(newObj, mapper, opts)
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
 * Walk over an object calling `walkFn` for each node. The original
 * object is deep-cloned by default making it possible to simply mutate each
 * node as needed in order to transform the object. The cloned object
 * is returned if `options.modifyInPlace` is not set to true.
 */
export const walkEach: WalkEach = (obj, walkFn, options = {}) => {
  if (!options.modifyInPlace) {
    obj = _.cloneDeep(obj)
  }
  walk(obj, options).forEach(walkFn)
  return obj
}

/**
 * @deprecated Use walkEach
 */
export const walkie = walkEach

/**
 * Like `walkEach` but awaits the promise returned by `walkFn` before proceeding to
 * the next node.
 */
export const walkEachAsync: WalkEachAsync = async (
  obj,
  walkFn,
  options = {}
) => {
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
 * @deprecated Use walkEachAsync
 */
export const walkieAsync = walkEachAsync

/**
 * Map over the leaves of an object with a fn. By default, nodes will be excluded
 * by returning `undefined`. Undefined array values will not be excluded. To customize
 * pass a fn for `options.shouldSkip`.
 */
export function mapLeaves<T>(
  obj: any,
  mapper: Mapper<T>,
  options: MapOptions & MutationOption = {}
) {
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

const chunkPath = (path: string[], separator: string) => {
  let nestedPath: string[] = []
  const chunkedPath = []
  const addNestedPath = () => {
    if (nestedPath.length) {
      chunkedPath.push(nestedPath.join(separator))
      nestedPath = []
    }
  }
  for (const key of path) {
    if (/[0-9]+/.test(key)) {
      addNestedPath()
      chunkedPath.push(key)
    } else {
      nestedPath.push(key)
    }
  }
  addNestedPath()
  return chunkedPath
}

/**
 * Flatten an object's keys. Optionally pass `separator` to determine
 * what character to join keys with. Defaults to '.'. If an array is
 * passed, an object of path to values is returned unless the `objectsOnly`
 * option is set.
 */
export const flatten: Flatten = (obj, options = {}) => {
  const nodes = walk(obj, { ...options, leavesOnly: true })
  const separator = options.separator || '.'
  const result: object = Array.isArray(obj) && options.objectsOnly ? [] : {}
  for (const node of nodes) {
    const path = options.objectsOnly
      ? chunkPath(node.path, separator)
      : [node.path.join(separator)]
    set(result, path, node.val)
  }
  return result
}

/**
 * Unflatten an object previously flattened. Optionally pass `separator`
 * to determine what character or RegExp to split keys with.
 * Defaults to '.'.
 */
export const unflatten: Unflatten = (obj, options = {}) => {
  const separator = options.separator || '.'
  return map(obj, ({ val }) => {
    if (val && typeof val === 'object' && _.isPlainObject(val)) {
      const keyPaths = Object.keys(val).map((key) => key.split(separator))
      return _.zipObjectDeep(keyPaths, Object.values(val))
    }
    return val
  }) as object
}

const buildCompactFilter = (options: CompactOptions) => {
  const fns: ((x: any, node: Node) => boolean)[] = []

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
  if (options.removeFn) {
    fns.push(options.removeFn)
  }
  return _.overSome(fns)
}

const TOMBSTONE = Symbol('TOMBSTONE')

/**
 * Compact an object, removing fields recursively according to the supplied options.
 * All option flags are `false` by default. If `compactArrays` is set to `true`, arrays
 * will be compacted based on the enabled 'remove' option flags.
 */
export const compact: Compact = (obj, options) => {
  const remove = buildCompactFilter(options)
  const mapper = (node: Node) => {
    let { val } = node
    // Remove all tombstone values
    if (options.compactArrays && Array.isArray(val)) {
      val = _.remove((x) => x === TOMBSTONE, val)
    }
    if (parentIsArray(node)) {
      if (options.compactArrays && remove(val, node)) {
        return TOMBSTONE
      }
      return val
    }
    if (!remove(val, node)) {
      return val
    }
  }
  return map(obj, mapper, { ...options, postOrder: true }) as object
}

/**
 * Truncate allows you to limit the depth of nested objects/arrays,
 * the length of strings, and the length of arrays. Instances of Error
 * can be converted to plain objects so that the enabled truncation options
 * also apply to the error fields. All truncation methods are opt-in.
 *
 * Note: For the best performance you should consider setting `modifyInPlace`
 * to `true`.
 *
 * Inspiration: https://github.com/runk/dtrim
 */
export const truncate: Truncate = (obj, options) => {
  const maxDepth = options.maxDepth || Infinity
  const replacementAtMaxDepth =
    'replacementAtMaxDepth' in options
      ? options.replacementAtMaxDepth
      : '[Truncated]'
  const maxArrayLength = options.maxArrayLength || Infinity
  const maxStringLength = options.maxStringLength || Infinity
  const replacementAtMaxStringLength =
    options.replacementAtMaxStringLength ?? '...'
  return map(
    obj,
    (node) => {
      const { path, val, isLeaf } = node
      // Max depth reached
      if (!isLeaf && path.length === maxDepth) {
        return replacementAtMaxDepth
      }
      // Array exceeds max length
      if (Array.isArray(val) && val.length > maxArrayLength) {
        return val.slice(0, maxArrayLength)
      }
      // Transform Error to plain object
      if (options.transformErrors && val instanceof Error) {
        return {
          message: val.message,
          name: val.name,
          ...(val.stack && { stack: val.stack }),
          ..._.toPlainObject(val),
        }
      }
      // String exceeds max length
      if (typeof val === 'string' && val.length > maxStringLength) {
        return `${val.slice(0, maxStringLength)}${replacementAtMaxStringLength}`
      }
      return val
    },
    options
  )
}

/**
 * Inspiration: https://github.com/miktam/sizeof
 */
const getSize = (val: any): number => {
  if (typeof val === 'boolean') {
    return ECMA_SIZES.BYTES
  } else if (typeof val === 'string') {
    // Strings are encoded using UTF-16
    return val.length * ECMA_SIZES.STRING
  } else if (typeof val === 'number') {
    // Numbers are 64-bit
    return ECMA_SIZES.NUMBER
  } else if (typeof val === 'symbol' && val.description) {
    return val.description.length * ECMA_SIZES.STRING
  } else if (typeof val === 'bigint') {
    // NOTE: There is no accurate way to get the actual byte size for bigint
    // https://stackoverflow.com/a/54298760/1242923
    return ECMA_SIZES.NUMBER
  }
  return 0
}

/**
 * Estimate the size in bytes.
 */
export const size = (val: any) => {
  if (isObjectOrArray(val)) {
    let bytes = 0
    walker(val, ({ isLeaf, val }) => {
      if (isLeaf) {
        bytes += getSize(val)
      }
    })
    return bytes
  }
  return getSize(val)
}
