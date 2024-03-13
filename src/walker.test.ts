import _ from 'lodash/fp'
import { describe, expect, test } from '@jest/globals'
import {
  flatten,
  walker,
  walk,
  walkie,
  map,
  mapLeaves,
  findNode,
  compact,
  truncate,
  walkieAsync,
  SHORT_CIRCUIT,
  size,
} from './walker'
import { parentIsArray } from './util'
import { Node } from './types'

describe('walker', () => {
  test('remove empty elements from an array (nested)', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: 'Bob',
        f: [10, null, 30, [31, undefined, 32], 40],
      },
      g: [25, '', { h: [null, 26, 27] }],
      i: 'Frank',
    }
    const walkFn = (node: Node) => {
      const { key, val, parents } = node
      const parent = parents[0]
      if (Array.isArray(val) && key) {
        parent[key] = _.compact(val)
      }
    }
    walker(obj, walkFn, { postOrder: true })
    expect(obj).toEqual({
      a: { b: 23, c: 24 },
      d: { e: 'Bob', f: [10, 30, [31, 32], 40] },
      g: [25, { h: [26, 27] }],
      i: 'Frank',
    })
  })
  test('should short-circuit', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
        d: {
          e: 25,
        },
      },
    }
    let numNodesVisited = 0
    const walkFn = (node: Node) => {
      numNodesVisited++
      const { val } = node
      if (val === 24) {
        return SHORT_CIRCUIT
      }
    }
    walker(obj, walkFn)
    expect(numNodesVisited).toBe(4)
  })
})

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
      bsonType: 'object',
      additionalProperties: false,
      required: ['name', 'type'],
      properties: {
        _id: {
          bsonType: 'objectId',
        },
        name: { bsonType: 'string' },
        numberOfEmployees: {
          bsonType: 'string',
          enum: ['1 - 5', '6 - 20', '21 - 50', '51 - 200', '201 - 500', '500+'],
        },
        addresses: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            additionalProperties: false,
            properties: {
              address: {
                bsonType: 'object',
                additionalProperties: false,
                properties: {
                  street: { bsonType: 'string' },
                  city: { bsonType: 'string' },
                  county: { bsonType: 'string' },
                  state: { bsonType: 'string' },
                  zip: { bsonType: 'string' },
                  country: { bsonType: 'string' },
                },
              },
              name: { bsonType: 'string' },
              isPrimary: { bsonType: 'bool' },
            },
          },
        },
        integrations: {
          bsonType: 'object',
          additionalProperties: true,
          properties: {
            stripe: {
              bsonType: 'object',
              additionalProperties: true,
              properties: {
                priceId: {
                  bsonType: 'string',
                },
                subscriptionStatus: {
                  bsonType: 'string',
                },
              },
            },
          },
        },
      },
    }
    const traverse = (x: any) => x.properties || (x.items && { items: x.items })
    const kvs = walk(obj, { traverse }).map(_.pick(['key', 'val']))
    expect(kvs).toEqual([
      {
        key: undefined,
        val: {
          bsonType: 'object',
          additionalProperties: false,
          required: ['name', 'type'],
          properties: {
            _id: { bsonType: 'objectId' },
            name: { bsonType: 'string' },
            numberOfEmployees: {
              bsonType: 'string',
              enum: [
                '1 - 5',
                '6 - 20',
                '21 - 50',
                '51 - 200',
                '201 - 500',
                '500+',
              ],
            },
            addresses: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                additionalProperties: false,
                properties: {
                  address: {
                    bsonType: 'object',
                    additionalProperties: false,
                    properties: {
                      street: { bsonType: 'string' },
                      city: { bsonType: 'string' },
                      county: { bsonType: 'string' },
                      state: { bsonType: 'string' },
                      zip: { bsonType: 'string' },
                      country: { bsonType: 'string' },
                    },
                  },
                  name: { bsonType: 'string' },
                  isPrimary: { bsonType: 'bool' },
                },
              },
            },
            integrations: {
              bsonType: 'object',
              additionalProperties: true,
              properties: {
                stripe: {
                  bsonType: 'object',
                  additionalProperties: true,
                  properties: {
                    priceId: { bsonType: 'string' },
                    subscriptionStatus: { bsonType: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      { key: '_id', val: { bsonType: 'objectId' } },
      { key: 'name', val: { bsonType: 'string' } },
      {
        key: 'numberOfEmployees',
        val: {
          bsonType: 'string',
          enum: ['1 - 5', '6 - 20', '21 - 50', '51 - 200', '201 - 500', '500+'],
        },
      },
      {
        key: 'addresses',
        val: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            additionalProperties: false,
            properties: {
              address: {
                bsonType: 'object',
                additionalProperties: false,
                properties: {
                  street: { bsonType: 'string' },
                  city: { bsonType: 'string' },
                  county: { bsonType: 'string' },
                  state: { bsonType: 'string' },
                  zip: { bsonType: 'string' },
                  country: { bsonType: 'string' },
                },
              },
              name: { bsonType: 'string' },
              isPrimary: { bsonType: 'bool' },
            },
          },
        },
      },
      {
        key: 'items',
        val: {
          bsonType: 'object',
          additionalProperties: false,
          properties: {
            address: {
              bsonType: 'object',
              additionalProperties: false,
              properties: {
                street: { bsonType: 'string' },
                city: { bsonType: 'string' },
                county: { bsonType: 'string' },
                state: { bsonType: 'string' },
                zip: { bsonType: 'string' },
                country: { bsonType: 'string' },
              },
            },
            name: { bsonType: 'string' },
            isPrimary: { bsonType: 'bool' },
          },
        },
      },
      {
        key: 'address',
        val: {
          bsonType: 'object',
          additionalProperties: false,
          properties: {
            street: { bsonType: 'string' },
            city: { bsonType: 'string' },
            county: { bsonType: 'string' },
            state: { bsonType: 'string' },
            zip: { bsonType: 'string' },
            country: { bsonType: 'string' },
          },
        },
      },
      { key: 'street', val: { bsonType: 'string' } },
      { key: 'city', val: { bsonType: 'string' } },
      { key: 'county', val: { bsonType: 'string' } },
      { key: 'state', val: { bsonType: 'string' } },
      { key: 'zip', val: { bsonType: 'string' } },
      { key: 'country', val: { bsonType: 'string' } },
      { key: 'name', val: { bsonType: 'string' } },
      { key: 'isPrimary', val: { bsonType: 'bool' } },
      {
        key: 'integrations',
        val: {
          bsonType: 'object',
          additionalProperties: true,
          properties: {
            stripe: {
              bsonType: 'object',
              additionalProperties: true,
              properties: {
                priceId: { bsonType: 'string' },
                subscriptionStatus: { bsonType: 'string' },
              },
            },
          },
        },
      },
      {
        key: 'stripe',
        val: {
          bsonType: 'object',
          additionalProperties: true,
          properties: {
            priceId: { bsonType: 'string' },
            subscriptionStatus: { bsonType: 'string' },
          },
        },
      },
      { key: 'priceId', val: { bsonType: 'string' } },
      { key: 'subscriptionStatus', val: { bsonType: 'string' } },
    ])
  })

  test('reduce a tree', () => {
    const obj = {
      joe: {
        age: 16,
        courses: {
          math: {
            scores: [95, 96, 87],
          },
          biology: {
            scores: [97, 94, 87],
          },
        },
      },
      bob: {
        age: 16,
        courses: {
          math: {
            scores: [88, 87, 75],
          },
          biology: {
            scores: [97, 94, 87],
          },
        },
      },
      frank: {
        age: 15,
        courses: {
          math: {
            scores: [90, 85, 73],
          },
          biology: {
            scores: [89, 87, 73],
          },
        },
      },
    }
    const nodes = walk(obj, { traverse: (x: any) => _.isPlainObject(x) && x })
    const avg = _.flow(
      _.filter({ key: 'scores' }),
      _.flatMap('val'),
      _.mean,
      _.round
    )(nodes)

    expect(avg).toBe(88)
  })
})

describe('findNode', () => {
  const obj = {
    name: 'Joe',
    address: {
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    likes: ['Stock Market', 'Running'],
  }
  test('should find a node and short-circuit', () => {
    let numNodesVisited = 0
    const node = findNode(obj, (node) => {
      numNodesVisited++
      return _.isEqual(node.path, ['address', 'zipCode'])
    })
    expect(node).toEqual({
      key: 'zipCode',
      val: '10001',
      parents: [
        { city: 'New York', state: 'NY', zipCode: '10001' },
        {
          name: 'Joe',
          address: { city: 'New York', state: 'NY', zipCode: '10001' },
          likes: ['Stock Market', 'Running'],
        },
      ],
      path: ['address', 'zipCode'],
      isLeaf: true,
      isRoot: false,
    })
    expect(numNodesVisited).toBe(6)
  })
  test('should return undefined if not found', () => {
    const node = findNode(obj, (node) => node.key === 'countryCode')
    expect(node).toBeUndefined()
  })
  test('should throw if an exception is throw in findFn', () => {
    expect(() => {
      findNode(obj, () => {
        throw 'fail'
      })
    }).toThrow()
  })
})

describe('walkie', () => {
  test('mutate a tree', () => {
    const obj = {
      bsonType: 'object',
      additionalProperties: false,
      required: ['name'],
      properties: {
        _id: {
          bsonType: 'objectId',
        },
        name: { bsonType: 'string' },
        addresses: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            additionalProperties: false,
            properties: {
              address: {
                bsonType: 'object',
                additionalProperties: false,
                properties: {
                  zip: { bsonType: 'string' },
                  country: { bsonType: 'string' },
                },
              },
            },
          },
        },
      },
    }

    const traverse = (x: any) => x.properties || (x.items && { items: x.items })
    const walkFn = ({ val }: Node) => {
      if ('additionalProperties' in val) {
        val.additionalProperties = true
      }
    }
    const newObj = walkie(obj, walkFn, { traverse })
    // Objects are not the same
    expect(obj).not.toBe(newObj)
    // additionalProperties set to true recursively
    expect(newObj).toEqual({
      bsonType: 'object',
      additionalProperties: true,
      required: ['name'],
      properties: {
        _id: { bsonType: 'objectId' },
        name: { bsonType: 'string' },
        addresses: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            additionalProperties: true,
            properties: {
              address: {
                bsonType: 'object',
                additionalProperties: true,
                properties: {
                  zip: { bsonType: 'string' },
                  country: { bsonType: 'string' },
                },
              },
            },
          },
        },
      },
    })
  })
  test('modifyInPlace', () => {
    const obj = {
      joe: { scores: [90, 80, 75, 95] },
      bob: { scores: [95, 87, 92, 88] },
      frank: { scores: [96, 86, 91, 84] },
      tom: null,
    }
    const result = walkie(
      obj,
      ({ val }) => {
        if (_.isPlainObject(val) && 'scores' in val) {
          val.avg = _.sum(val.scores) / val.scores.length
        }
      },
      { modifyInPlace: true }
    )
    expect(obj).toBe(result)
    expect(result).toEqual({
      joe: { scores: [90, 80, 75, 95], avg: 85 },
      bob: { scores: [95, 87, 92, 88], avg: 90.5 },
      frank: { scores: [96, 86, 91, 84], avg: 89.25 },
      tom: null,
    })
  })
})

describe('walkieAsync', () => {
  test('should await walkFn', async () => {
    const obj = {
      joe: { scores: [90, 80, 75, 95] },
      bob: { scores: [95, 87, 92, 88] },
      frank: { scores: [96, 86, 91, 84] },
      tom: null,
    }
    const result = await walkieAsync(obj, async ({ val }) => {
      if (_.isPlainObject(val) && 'scores' in val) {
        val.avg = _.sum(val.scores) / val.scores.length
      }
    })
    expect(obj).not.toBe(result)
    expect(result).toEqual({
      joe: { scores: [90, 80, 75, 95], avg: 85 },
      bob: { scores: [95, 87, 92, 88], avg: 90.5 },
      frank: { scores: [96, 86, 91, 84], avg: 89.25 },
      tom: null,
    })
  })
})

describe('map', () => {
  test('preorder', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: 'Bob',
        f: [10, null, 30, [31, undefined, 32], 40],
      },
      g: [25, '', { h: [null, 26, 27] }],
      i: 'Frank',
    }
    const result = map(obj, ({ val }) =>
      Array.isArray(val) ? _.compact(val) : val
    )
    expect(obj).toEqual(obj)
    expect(obj).not.toBe(result)
    expect(result).toEqual({
      a: { b: 23, c: 24 },
      d: { e: 'Bob', f: [10, 30, [31, 32], 40] },
      g: [25, { h: [26, 27] }],
      i: 'Frank',
    })
  })
  test('preorder - top-level mapping', () => {
    const obj = {
      bsonType: 'object',
      additionalProperties: false,
      required: ['name'],
      properties: {
        _id: {
          bsonType: 'objectId',
        },
        name: { bsonType: 'string' },
        addresses: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            additionalProperties: false,
            properties: {
              address: {
                bsonType: 'object',
                additionalProperties: false,
                properties: {
                  zip: { bsonType: 'string' },
                  country: { bsonType: 'string' },
                },
              },
            },
          },
        },
      },
    }
    const convertSchemaNode = (obj: Record<string, any>) => {
      return {
        ..._.pick(['properties'], obj),
        ...(obj.bsonType !== 'object' && { type: obj.bsonType }),
      }
    }
    const mapper = (node: Node) => {
      const { key, val, parents } = node
      // Ignore top-level _id field
      if (key === '_id' && parents.length === 2) {
        return
      }
      if (val?.bsonType) {
        if (val.bsonType === 'array') {
          return convertSchemaNode(val.items)
        }
        return convertSchemaNode(val)
      }
      return val
    }
    expect(map(obj, mapper)).toEqual({
      properties: {
        name: { type: 'string' },
        addresses: {
          properties: {
            address: {
              properties: {
                zip: { type: 'string' },
                country: { type: 'string' },
              },
            },
          },
        },
      },
    })
  })
  test('postorder', () => {
    const obj = {
      bob: {
        scores: ['87', 'x97', 95, false],
      },
      joe: {
        scores: [92, 92.5, '73.2', ''],
      },
      frank: {
        scores: ['abc', ''],
      },
    }
    const result = map(
      obj,
      ({ val, isLeaf }) => {
        if (isLeaf) {
          return parseFloat(val)
        }
        return Array.isArray(val) ? _.compact(val) : val
      },
      { postOrder: true }
    )
    // Objects are not the same
    expect(obj).not.toBe(result)
    expect(result).toEqual({
      bob: { scores: [87, 95] },
      joe: { scores: [92, 92.5, 73.2] },
      frank: { scores: [] },
    })
  })
  test('postorder - top-level mapping', () => {
    const obj = ['87', 95, 'foo']
    const result = map(
      obj,
      ({ val, isLeaf }) => {
        if (isLeaf) {
          return parseFloat(val)
        }
        return Array.isArray(val) ? _.compact(val) : val
      },
      { postOrder: true }
    )
    expect(result).toEqual([87, 95])
  })
  test('custom shouldSkip fn', () => {
    const obj = {
      bob: {
        scores: ['87', 'x97', 95, false],
      },
      joe: {
        scores: [92, 92.5, '73.2', ''],
      },
      frank: {
        scores: ['abc', ''],
      },
    }
    const shouldSkip = (val: any, node: Node) =>
      _.isEmpty(val) && !parentIsArray(node)
    const result = map(
      obj,
      ({ val, isLeaf }) => {
        if (isLeaf) {
          return parseFloat(val)
        }
        return Array.isArray(val) ? _.compact(val) : val
      },
      { postOrder: true, shouldSkip }
    )
    expect(obj).toEqual(obj)
    expect(result).toEqual({
      bob: { scores: [87, 95] },
      joe: { scores: [92, 92.5, 73.2] },
    })
  })
  test('exclude nodes', () => {
    const obj = {
      joe: {
        age: 42,
        username: 'joe blow',
        password: '1234',
      },
      frank: {
        age: 39,
        username: 'frankenstein',
        password: 'password',
      },
    }
    const result = map(obj, ({ key, val }) => {
      if (key !== 'password') {
        return val
      }
    })
    expect(obj).toEqual(obj)
    expect(result).toEqual({
      joe: { age: 42, username: 'joe blow' },
      frank: { age: 39, username: 'frankenstein' },
    })
  })
  test('map while modifying in place', () => {
    const obj = {
      bob: {
        scores: ['87', 'x97', 95, false],
      },
      joe: {
        scores: [92, 92.5, '73.2', ''],
      },
      frank: {
        scores: ['abc', ''],
      },
    }
    const result = map(
      obj,
      ({ val, isLeaf }) => {
        if (isLeaf) {
          return parseFloat(val)
        }
        return Array.isArray(val) ? _.compact(val) : val
      },
      { postOrder: true, modifyInPlace: true }
    )
    // Objects are the same
    expect(obj).toBe(result)
    expect(result).toEqual({
      bob: { scores: [87, 95] },
      joe: { scores: [92, 92.5, 73.2] },
      frank: { scores: [] },
    })
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
    expect(obj).toEqual(obj)
    expect(result).toEqual({
      a: { b: 24, c: 25 },
      d: { e: 101, f: [11, 21, 31] },
    })
  })
  test('should modify in place', () => {
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
    const result = mapLeaves(obj, ({ val }) => val + 1, { modifyInPlace: true })
    expect(obj).toBe(result)
    expect(result).toEqual({
      a: { b: 24, c: 25 },
      d: { e: 101, f: [11, 21, 31] },
    })
  })
})

describe('flatten', () => {
  test('should flatten object', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: 100,
        f: [10, 20, { g: 30, h: { i: 40 } }],
      },
    }
    const result = flatten(obj)
    expect(result).toEqual({
      'a.b': 23,
      'a.c': 24,
      'd.e': 100,
      'd.f.0': 10,
      'd.f.1': 20,
      'd.f.2.g': 30,
      'd.f.2.h.i': 40,
    })
  })
  test('should flatten object with objectsOnly set to true', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: 100,
        f: [10, 20, { g: 30, h: { i: 40 } }],
      },
    }
    const result = flatten(obj, { objectsOnly: true })
    expect(result).toEqual({
      'a.b': 23,
      'a.c': 24,
      'd.e': 100,
      'd.f': [10, 20, { g: 30, 'h.i': 40 }],
    })
  })
  test('should flatten array', () => {
    const arr = [10, 20, { a: { b: 20, c: 30, d: [40, { e: { f: 50 } }] } }]
    const result = flatten(arr)
    expect(result).toEqual({
      '0': 10,
      '1': 20,
      '2.a.b': 20,
      '2.a.c': 30,
      '2.a.d.0': 40,
      '2.a.d.1.e.f': 50,
    })
  })
  test('should flatten array with objectsOnly set to true', () => {
    const arr = [10, 20, { a: { b: 20, c: 30, d: [40, { e: { f: 50 } }] } }]
    const result = flatten(arr, { objectsOnly: true })
    expect(result).toEqual([
      10,
      20,
      { 'a.b': 20, 'a.c': 30, 'a.d': [40, { 'e.f': 50 }] },
    ])
  })
  test('should flatten with custom traversal and custom separator', () => {
    const obj = {
      bsonType: 'object',
      additionalProperties: false,
      required: ['name', 'type'],
      properties: {
        _id: {
          bsonType: 'objectId',
        },
        name: { bsonType: 'string' },
        numberOfEmployees: {
          bsonType: 'string',
          enum: ['1 - 5', '6 - 20', '21 - 50', '51 - 200', '201 - 500', '500+'],
        },
        addresses: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            additionalProperties: false,
            properties: {
              address: {
                bsonType: 'object',
                additionalProperties: false,
                properties: {
                  street: { bsonType: 'string' },
                  city: { bsonType: 'string' },
                  county: { bsonType: 'string' },
                  state: { bsonType: 'string' },
                  zip: { bsonType: 'string' },
                  country: { bsonType: 'string' },
                },
              },
              name: { bsonType: 'string' },
              isPrimary: { bsonType: 'bool' },
            },
          },
        },
        integrations: {
          bsonType: 'object',
          additionalProperties: true,
          properties: {
            stripe: {
              bsonType: 'object',
              additionalProperties: true,
              properties: {
                priceId: {
                  bsonType: 'string',
                },
                subscriptionStatus: {
                  bsonType: 'string',
                },
              },
            },
          },
        },
      },
    }
    const traverse = (x: any) => x.properties || (x.items && { items: x.items })
    const result = flatten(obj, { traverse, separator: '_' })
    expect(result).toEqual({
      _id: { bsonType: 'objectId' },
      name: { bsonType: 'string' },
      numberOfEmployees: {
        bsonType: 'string',
        enum: ['1 - 5', '6 - 20', '21 - 50', '51 - 200', '201 - 500', '500+'],
      },
      addresses_items_address_street: { bsonType: 'string' },
      addresses_items_address_city: { bsonType: 'string' },
      addresses_items_address_county: { bsonType: 'string' },
      addresses_items_address_state: { bsonType: 'string' },
      addresses_items_address_zip: { bsonType: 'string' },
      addresses_items_address_country: { bsonType: 'string' },
      addresses_items_name: { bsonType: 'string' },
      addresses_items_isPrimary: { bsonType: 'bool' },
      integrations_stripe_priceId: { bsonType: 'string' },
      integrations_stripe_subscriptionStatus: { bsonType: 'string' },
    })
  })
})

describe('compact', () => {
  test('should remove undefined', () => {
    const obj = {
      a: {
        b: undefined,
      },
      c: undefined,
      d: 42,
      e: [undefined],
    }
    const result = compact(obj, { removeUndefined: true })
    expect(result).toEqual({ a: {}, d: 42, e: [undefined] })
    // Objects are not the same
    expect(obj).not.toBe(result)
  })
  test('should remove null', () => {
    const obj = {
      a: {
        b: null,
      },
      c: null,
      d: 42,
      e: [null],
    }
    const result = compact(obj, { removeNull: true })
    expect(result).toEqual({ a: {}, d: 42, e: [null] })
  })
  test('should remove empty string', () => {
    const obj = {
      a: {
        b: '',
      },
      c: '',
      d: 42,
      e: [''],
    }
    const result = compact(obj, { removeEmptyString: true })
    expect(result).toEqual({ a: {}, d: 42, e: [''] })
  })
  test('should remove false', () => {
    const obj = {
      a: {
        b: false,
      },
      c: false,
      d: 42,
      e: [false],
    }
    const result = compact(obj, { removeFalse: true })
    expect(result).toEqual({ a: {}, d: 42, e: [false] })
  })
  test('should remove NaN', () => {
    const obj = {
      a: {
        b: NaN,
      },
      c: NaN,
      d: 42,
      e: [NaN],
    }
    const result = compact(obj, { removeNaN: true })
    expect(result).toEqual({ a: {}, d: 42, e: [NaN] })
  })
  test('should remove using remove fn', () => {
    const obj = {
      a: {
        b: 'null',
      },
      c: 'null',
      d: 42,
      e: ['null'],
    }
    const result = compact(obj, { removeFn: (val: any) => val === 'null' })
    expect(result).toEqual({ a: {}, d: 42, e: ['null'] })
  })
  test('should remove using remove fn based on second param', () => {
    const obj = {
      a: {
        b: 'null',
      },
      c: 'null',
    }
    const result = compact(obj, {
      removeFn: (_val: any, node: Node) => _.isEqual(node.path, ['a', 'b']),
    })
    expect(result).toEqual({ a: {}, c: 'null' })
  })
  test('should remove array elem using remove fn based on second param', () => {
    const obj = {
      joe: {
        grades: [90, 85, 92],
      },
      bob: {
        grades: [89, 87, 94],
      },
    }
    const result = compact(obj, {
      removeFn: (_val: any, node: Node) => node.key === '0',
      compactArrays: true,
    })
    expect(result).toEqual({
      joe: { grades: [85, 92] },
      bob: { grades: [87, 94] },
    })
  })
  test('should remove empty object', () => {
    const obj = {
      a: {
        b: {},
      },
      c: {},
      d: 42,
    }
    const result = compact(obj, { removeEmptyObject: true })
    expect(result).toEqual({ d: 42 })
  })
  test('should remove empty array', () => {
    const obj = {
      a: {
        b: [],
      },
      c: [],
      d: 42,
    }
    const result = compact(obj, { removeEmptyArray: true })
    expect(result).toEqual({ a: {}, d: 42 })
  })
  test('should compact arrays', () => {
    const obj = {
      a: {
        b: [null, null],
      },
      c: [],
      d: [42, null, ''],
    }
    const result = compact(obj, { removeNull: true, compactArrays: true })
    expect(result).toEqual({ a: { b: [] }, c: [], d: [42, ''] })
  })
  test('should compact and remove empty arrays', () => {
    const obj = {
      a: {
        b: [null, null],
      },
      c: [],
      d: [42, null],
    }
    const result = compact(obj, {
      removeNull: true,
      compactArrays: true,
      removeEmptyArray: true,
    })
    expect(result).toEqual({ a: {}, d: [42] })
  })
  test('should compact top-level array', () => {
    const arr = ['', 2, null, 3, {}, 4, [[undefined]], 5]
    const result = compact(arr, {
      removeUndefined: true,
      removeEmptyString: true,
      removeNull: true,
      removeEmptyObject: true,
      removeEmptyArray: true,
      compactArrays: true,
    })
    expect(result).toEqual([2, 3, 4, 5])
  })
  test('should compact all the things', () => {
    const obj = {
      a: {
        b: [null, null, 21, '', { b1: null }, { b2: 26 }],
      },
      c: [],
      d: [42, null],
      e: {
        f: {
          g: '',
          h: undefined,
          i: 'null',
        },
      },
    }
    const result = compact(obj, {
      removeUndefined: true,
      removeEmptyString: true,
      removeNull: true,
      compactArrays: true,
      removeEmptyArray: true,
      removeEmptyObject: true,
      removeFn: (val: any) => val === 'null',
    })
    expect(result).toEqual({
      a: { b: [21, { b2: 26 }] },
      d: [42],
    })
  })
  test('should compact while modifying object in place', () => {
    const obj = {
      a: {
        b: undefined,
      },
      c: undefined,
      d: 42,
      e: [undefined],
    }
    const result = compact(obj, { removeUndefined: true, modifyInPlace: true })
    expect(result).toEqual({ a: {}, d: 42, e: [undefined] })
    // Objects are the same
    expect(obj).toBe(result)
  })
})

describe('truncate', () => {
  test('should truncate depth 1', () => {
    const obj = {
      a: {
        b: 'Frank',
      },
      c: 'Bob',
      d: 42,
      e: null,
    }
    const result = truncate(obj, { maxDepth: 1 })
    expect(result).toEqual({
      a: '[Truncated]',
      c: 'Bob',
      d: 42,
      e: null,
    })
    // Objects are not the same
    expect(obj).not.toBe(result)
  })
  test('should truncate depth 2', () => {
    const obj = {
      a: {
        b: 'Frank',
        c: {
          d: 'Joe',
        },
        e: null,
      },
      f: 42,
    }
    const result = truncate(obj, { maxDepth: 2 })
    expect(result).toEqual({
      a: {
        b: 'Frank',
        c: '[Truncated]',
        e: null,
      },
      f: 42,
    })
  })
  test('should truncate arrays', () => {
    const obj = {
      a: {
        b: 'Frank',
        c: {
          d: ['Bob', { name: 'Joe' }, 'Tom'],
        },
        e: null,
      },
      f: 42,
    }
    const result = truncate(obj, { maxDepth: 4 })
    expect(result).toEqual({
      a: { b: 'Frank', c: { d: ['Bob', '[Truncated]', 'Tom'] }, e: null },
      f: 42,
    })
  })
  test('should allow custom replacement text', () => {
    const obj = {
      a: {
        b: 'Frank',
      },
      c: 'Bob',
      d: 42,
      e: null,
    }
    const result = truncate(obj, { maxDepth: 1, replacementAtMaxDepth: null })
    expect(result).toEqual({
      a: null,
      c: 'Bob',
      d: 42,
      e: null,
    })
  })
  test('should truncate and modify object in place', () => {
    const obj = {
      a: {
        b: 'Frank',
      },
      c: 'Bob',
      d: 42,
      e: null,
    }
    const result = truncate(obj, { maxDepth: 1, modifyInPlace: true })
    expect(result).toEqual({
      a: '[Truncated]',
      c: 'Bob',
      d: 42,
      e: null,
    })
    // Objects are the same
    expect(obj).toBe(result)
  })
  test('should handle Error', () => {
    class ValidationError extends Error {
      context: object
      constructor(message: any, context: object) {
        super(message)
        this.name = 'ValidationError'
        this.context = context
      }
    }
    const context = { a: { b: { c: { d: 'missing' } } } }
    const error = new ValidationError('failure', context)

    const obj = {
      error,
    }
    const result = truncate(obj, { maxDepth: 5, transformErrors: true })
    expect(result).toMatchObject({
      error: {
        message: 'failure',
        name: 'ValidationError',
        context: { a: { b: { c: '[Truncated]' } } },
      },
    })
  })
  test('should truncate strings', () => {
    const obj = {
      a: {
        b: '1234567890',
      },
      c: '123',
      d: 42,
      e: null,
    }
    const result = truncate(obj, { maxStringLength: 5 })
    expect(result).toEqual({ a: { b: '12345...' }, c: '123', d: 42, e: null })
  })
  test('should truncate strings with custom replacement text', () => {
    const obj = {
      a: {
        b: '1234567890',
      },
      c: '123',
      d: 42,
      e: null,
    }
    const result = truncate(obj, {
      maxStringLength: 5,
      replacementAtMaxStringLength: '',
    })
    expect(result).toEqual({ a: { b: '12345' }, c: '123', d: 42, e: null })
  })
  test('should truncate arrays', () => {
    const obj = {
      a: [1, 2, 3, 4, 5],
      c: '123',
      d: [1, 2],
      e: null,
    }
    const result = truncate(obj, { maxArrayLength: 3 })
    expect(result).toEqual({
      a: [1, 2, 3],
      c: '123',
      d: [1, 2],
      e: null,
    })
  })
})

describe('size', () => {
  test('should return number of bytes for strings', () => {
    const obj = {
      a: {
        b: 'hello',
      },
    }
    const result = size(obj)
    expect(result).toBe(10)
  })
  test('should return number of bytes for symbols', () => {
    const obj = {
      a: {
        b: Symbol('hello'),
      },
    }
    const result = size(obj)
    expect(result).toBe(10)
  })
  test('should return number of bytes for booleans', () => {
    const obj = {
      a: {
        b: [true, false],
      },
    }
    const result = size(obj)
    expect(result).toBe(8)
  })
  test('should return number of bytes for numbers', () => {
    const obj = {
      a: {
        b: [42, 10n],
      },
    }
    const result = size(obj)
    expect(result).toBe(16)
  })
  test('should return number of bytes for mixed types', () => {
    const obj = {
      a: {
        b: 'hello',
      },
      c: Symbol('hello'),
      d: {
        e: [true, false]
      },
      f: [42, 10n]
    }
    const result = size(obj)
    expect(result).toBe(44)
  })
  test('should handle scalar value', () => {
    const result = size('hello')
    expect(result).toBe(10)
  })
  test('should handle top-level array', () => {
    const result = size(['joe', 'frank'])
    expect(result).toBe(16)
  })
  test('should return 0 bytes if there are no leaf nodes', () => {
    const obj = {
      a: {
        b: {},
      },
    }
    const result = size(obj)
    expect(result).toBe(0)
  })
})
