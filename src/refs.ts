import { decycle, retrocycle } from 'json-decycle'
import { map } from './walker'
import { Node, RefOptions } from './types'

export const addRefs = (obj: object, options?: RefOptions) => {
  const fn = decycle()
  const mapper = ({ key, val, parents, isLeaf }: Node) => {
    if (isLeaf) return
    return fn.call(parents[0], key ?? '', val)
  }
  return map(obj, mapper, { ...options, jsonCompat: true })
}

export const deref = (obj: object, options?: RefOptions) => {
  const fn = retrocycle()
  const mapper = ({ key, val, parents }: Node) =>
    fn.call(parents[0], key ?? '', val)
  return map(obj, mapper, {
    ...options,
    postOrder: true,
    jsonCompat: true,
  })
}
