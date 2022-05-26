import _ from 'lodash/fp'
import { describe, expect, test } from '@jest/globals'
import { walk, map, mapLeaves } from './walker'

describe('walk', () => {
  test('walk with no options', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: 'Bob',
        f: [10, 20, 30],
      },
    }
    const result = walk(obj)
    expect(result).toEqual([
      {
        key: undefined,
        parents: [],
        val: { a: { b: 23, c: 24 }, d: { e: 'Bob', f: [10, 20, 30] } },
        path: [],
        isRoot: true,
        isLeaf: false,
      },
      {
        key: 'a',
        val: { b: 23, c: 24 },
        parents: [{ a: { b: 23, c: 24 }, d: { e: 'Bob', f: [10, 20, 30] } }],
        path: ['a'],
        isLeaf: false,
        isRoot: false,
      },
      {
        key: 'b',
        val: 23,
        parents: [
          { b: 23, c: 24 },
          { a: { b: 23, c: 24 }, d: { e: 'Bob', f: [10, 20, 30] } },
        ],
        path: ['a', 'b'],
        isLeaf: true,
        isRoot: false,
      },
      {
        key: 'c',
        val: 24,
        parents: [
          { b: 23, c: 24 },
          { a: { b: 23, c: 24 }, d: { e: 'Bob', f: [10, 20, 30] } },
        ],
        path: ['a', 'c'],
        isLeaf: true,
        isRoot: false,
      },
      {
        key: 'd',
        val: { e: 'Bob', f: [10, 20, 30] },
        parents: [{ a: { b: 23, c: 24 }, d: { e: 'Bob', f: [10, 20, 30] } }],
        path: ['d'],
        isLeaf: false,
        isRoot: false,
      },
      {
        key: 'e',
        val: 'Bob',
        parents: [
          { e: 'Bob', f: [10, 20, 30] },
          { a: { b: 23, c: 24 }, d: { e: 'Bob', f: [10, 20, 30] } },
        ],
        path: ['d', 'e'],
        isLeaf: true,
        isRoot: false,
      },
      {
        key: 'f',
        val: [10, 20, 30],
        parents: [
          { e: 'Bob', f: [10, 20, 30] },
          { a: { b: 23, c: 24 }, d: { e: 'Bob', f: [10, 20, 30] } },
        ],
        path: ['d', 'f'],
        isLeaf: false,
        isRoot: false,
      },
      {
        key: '0',
        val: 10,
        parents: [
          [10, 20, 30],
          { e: 'Bob', f: [10, 20, 30] },
          { a: { b: 23, c: 24 }, d: { e: 'Bob', f: [10, 20, 30] } },
        ],
        path: ['d', 'f', '0'],
        isLeaf: true,
        isRoot: false,
      },
      {
        key: '1',
        val: 20,
        parents: [
          [10, 20, 30],
          { e: 'Bob', f: [10, 20, 30] },
          { a: { b: 23, c: 24 }, d: { e: 'Bob', f: [10, 20, 30] } },
        ],
        path: ['d', 'f', '1'],
        isLeaf: true,
        isRoot: false,
      },
      {
        key: '2',
        val: 30,
        parents: [
          [10, 20, 30],
          { e: 'Bob', f: [10, 20, 30] },
          { a: { b: 23, c: 24 }, d: { e: 'Bob', f: [10, 20, 30] } },
        ],
        path: ['d', 'f', '2'],
        isLeaf: true,
        isRoot: false,
      },
    ])
  })
  test('walk preorder', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: 'Bob',
        f: [10, 20, 30],
      },
    }
    const result = walk(obj).map((x) => x.path)
    expect(result).toEqual([
      [],
      ['a'],
      ['a', 'b'],
      ['a', 'c'],
      ['d'],
      ['d', 'e'],
      ['d', 'f'],
      ['d', 'f', '0'],
      ['d', 'f', '1'],
      ['d', 'f', '2'],
    ])
  })
  test('walk postorder', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: 'Bob',
        f: [10, 20, 30],
      },
    }
    const result = walk(obj, { postOrder: true }).map((x) => x.path)
    expect(result).toEqual([
      ['a', 'b'],
      ['a', 'c'],
      ['a'],
      ['d', 'e'],
      ['d', 'f', '0'],
      ['d', 'f', '1'],
      ['d', 'f', '2'],
      ['d', 'f'],
      ['d'],
      [],
    ])
  })
  test('walk with custom traverse fn', () => {
    const obj = {
      api: {
        input: [1, 2, 3],
        output: { '1': 'foo', '2': 'bar', '3': 'baz' },
      },
      details: {
        input: { '1': 'foo', '2': 'bar', '3': 'baz' },
        output: { '1': 'bla', '2': 'bla', '3': 'bla' },
      },
      writeToDB: { input: { '1': 'bla', '2': 'bla', '3': 'bla' } },
    }
    const traverse = (x: any) => x.input || x.output
    const nodes = walk(obj, { traverse }).map((x) => x.path)
    expect(nodes).toEqual([
      [],
      ['api'],
      ['api', 'input'],
      ['api', 'output'],
      ['details'],
      ['details', 'input'],
      ['details', 'output'],
      ['writeToDB'],
      ['writeToDB', 'input'],
    ])
  })
})

describe('map', () => {
  test('remove empty elements from an array', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: 'Bob',
        f: [10, null, 30, undefined, 40],
      },
      g: [25, ''],
    }
    const result = map(
      obj,
      ({ val }) => {
        if (Array.isArray(val)) {
          return _.compact(val)
        }
        return val
      },
      { traverse: _.isPlainObject }
    )
    expect(result).toEqual({
      a: { b: 23, c: 24 },
      d: { e: 'Bob', f: [10, 30, 40] },
      g: [25],
    })
  })
  test('map over leaves (post order)', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: 'Bob',
        f: [10, 20, 30],
      },
    }
    const result = map(
      obj,
      ({ isLeaf, val }) => {
        // Only deal with leaves
        if (!isLeaf) {
          return
        }
        if (typeof val === 'number') {
          return val + 1
        }
        // Prune Bob node
        if (val === 'Bob') {
          return
        }
        return val
      },
      { postOrder: true }
    )
    expect(result).toEqual({ a: { b: 24, c: 25 }, d: { f: [11, 21, 31] } })
  })
})

describe('mapLeaves', () => {
  test('should increment leave values', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: 100,
        f: [10, 20, 30],
      },
    }
    const result = mapLeaves(obj, ({ val }) => val + 1)
    expect(result).toEqual({
      a: { b: 24, c: 25 },
      d: { e: 101, f: [11, 21, 31] },
    })
  })
  test('should prune some leaves', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: null,
        f: [10, 20, 30],
      },
    }
    const result = mapLeaves(obj, ({ val }) => {
      if (val !== null) return val
    })
    expect(result).toEqual({
      a: {
        b: 23,
        c: 24,
      },
      d: {
        f: [10, 20, 30],
      },
    })
  })
})
