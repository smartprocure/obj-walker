import _ from 'lodash/fp'
import { describe, expect, test } from '@jest/globals'
import { walk, map, mapKV, mapLeaves } from './walker'

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
    const nodes = walk(obj, { traverse })
    const kvs = nodes.map(_.pick(['key', 'val']))
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
    // Mutate the tree, changing the key bsonType to type
    nodes.forEach(({ val }) => {
      val.type = val.bsonType
      delete val.bsonType
    })
    expect(obj).toEqual({
      additionalProperties: false,
      required: ['name', 'type'],
      properties: {
        _id: { type: 'objectId' },
        name: { type: 'string' },
        numberOfEmployees: {
          enum: ['1 - 5', '6 - 20', '21 - 50', '51 - 200', '201 - 500', '500+'],
          type: 'string',
        },
        addresses: {
          items: {
            additionalProperties: false,
            properties: {
              address: {
                additionalProperties: false,
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                  county: { type: 'string' },
                  state: { type: 'string' },
                  zip: { type: 'string' },
                  country: { type: 'string' },
                },
                type: 'object',
              },
              name: { type: 'string' },
              isPrimary: { type: 'bool' },
            },
            type: 'object',
          },
          type: 'array',
        },
        integrations: {
          additionalProperties: true,
          properties: {
            stripe: {
              additionalProperties: true,
              properties: {
                priceId: { type: 'string' },
                subscriptionStatus: { type: 'string' },
              },
              type: 'object',
            },
          },
          type: 'object',
        },
      },
      type: 'object',
    })
  })

  test('mutate a tree after walking', () => {
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

    walk(obj, { traverse }).forEach(({ val }) => {
      if (val.hasOwnProperty('additionalProperties')) {
        val.additionalProperties = true
      }
    })
    expect(obj).toEqual({
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
        f: [10, null, 30, undefined, 40],
      },
      g: [25, ''],
      h: 'Frank',
    }
    const result = map(
      obj,
      ({ val }) => (Array.isArray(val) ? _.compact(val) : val),
      { traverse: (x: any) => _.isPlainObject(x) && x }
    )
    expect(result).toEqual({
      a: { b: 23, c: 24 },
      d: { e: 'Bob', f: [10, 30, 40] },
      g: [25],
      h: 'Frank',
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

describe('mapKV', () => {
  test('should modify keys and values', () => {
    const obj = {
      bob: {
        age: 17,
        scores: [95, 96, 83],
      },
      joe: {
        age: 16,
        scores: [87, 82, 77],
      },
      frank: {
        age: 16,
        scores: [78, 85, 89],
      },
    }
    const result = mapKV(
      obj,
      ({ key, val }) => {
        if (key === 'scores') {
          return ['testScores', val.map((x: number) => x + 1)]
        }
        return [key, val]
      },
      { traverse: (x: any) => _.isPlainObject(x) && x }
    )
    expect(result).toEqual({
      bob: { age: 17, testScores: [96, 97, 84] },
      joe: { age: 16, testScores: [88, 83, 78] },
      frank: { age: 16, testScores: [79, 86, 90] },
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
