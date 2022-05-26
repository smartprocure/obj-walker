const _ = require('lodash/fp')
const F = require('futil')

let Tree = F.tree()

const isObjectOrArray = _.overSome([_.isPlainObject, _.isArray])

// Convert to {key, value, parents: [{key, value}] }
let objectIterator = (value, key, parentValues, parentKeys) => ({
  key,
  value,
  parents: _.map(
    ([key, value]) => ({ key, value }),
    _.zip(parentKeys, parentValues)
  ),
  isLeaf: !isObjectOrArray(value),
  isRoot: key === undefined,
})

const toRefs = (obj) => {
  const fn = decycle()
  const mapper = ({ key, val, parents, isLeaf }) => {
    if (isLeaf) {
      return undefined
    }
    const parent = parents[0]
    const res = fn.call(parent, key, val)
    return res
  }
  const result = map(obj, mapper, { jsonCompat: true })
  // Remove root
  delete result['undefined']
  return result
}

const deref = (obj) => {
  const fn = retrocycle()
  const mapper = ({ key, val, parents }) => {
    const parent = parents[0]
    const res = fn.call(parent, key, val)
    return res
  }
  const result = map(objectWithRefs, mapper, {
    depthFirst: true,
    jsonCompat: true,
  })
  // Remove root
  delete result['undefined']
  return result
}

const obj = { a: { c: 1, d: 2 }, b: { e: 3, f: 4 } }

const map = (obj, mapFn, options) => {
  const mapper = (...args) => {
    const node = objectIterator(...args)

    console.log(node)
  }
  const preFn = !options.postOrder ? mapper : _.noop
  const postFn = options.postOrder ? mapper : _.noop

  const tree = F.tree()(preFn, postFn)
  tree.map(mapper, obj)
}
