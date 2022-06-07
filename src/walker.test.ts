import _ from 'lodash/fp'
import { describe, expect, test } from '@jest/globals'
import { walker, walk, walkie, map, mapPost, mapLeaves } from './walker'
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
      if (val.hasOwnProperty('additionalProperties')) {
        val.additionalProperties = true
      }
    }
    const newObj = walkie(obj, walkFn, { traverse })
    // Original object wasn't modified
    expect(obj).toEqual(obj)
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
        f: [10, null, 30, [31, undefined, 32], 40],
      },
      g: [25, '', { h: [null, 26, 27] }],
      i: 'Frank',
    }
    const result = map(obj, ({ val }) =>
      Array.isArray(val) ? _.compact(val) : val
    )
    expect(result).toEqual({
      a: { b: 23, c: 24 },
      d: { e: 'Bob', f: [10, 30, [31, 32], 40] },
      g: [25, { h: [26, 27] }],
      i: 'Frank',
    })
  })
})

describe('mapPost', () => {
  test.only('Apply postFn after mapper', () => {
    const obj = {
      bob: {
        scores: ['87', 'x97', 95, false],
      },
      joe: {
        scores: [92, 92.5, '73.2', ''],
      },
    }
    const result = mapPost(obj, ({ val, isLeaf }) => {
      if (isLeaf) {
        return parseFloat(val)
      }
      return Array.isArray(val) ? _.compact(val) : val
    })
    expect(result).toEqual({
      bob: { scores: [87, 95] },
      joe: { scores: [92, 92.5, 73.2] },
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
    expect(result).toEqual({
      a: { b: 24, c: 25 },
      d: { e: 101, f: [11, 21, 31] },
    })
  })
  test('should remove nulls from leaves', () => {
    const obj = {
      a: {
        b: 23,
        c: 24,
      },
      d: {
        e: null,
        f: [10, null, 30],
      },
    }
    const result = mapLeaves(
      obj,
      ({ val }) => {
        if (Array.isArray(val)) return _.compact(val)
        if (val !== null) return val
      },
      { traverse: (x: any) => _.isPlainObject(x) && x }
    )
    expect(result).toEqual({
      a: {
        b: 23,
        c: 24,
      },
      d: {
        f: [10, 30],
      },
    })
  })
})
