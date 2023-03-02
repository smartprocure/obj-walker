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
    expect(obj).toEqual(obj)
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
        f: [10, 20, 30],
      },
    }
    const result = flatten(obj)
    expect(result).toEqual({
      'a.b': 23,
      'a.c': 24,
      'd.e': 100,
      'd.f.0': 10,
      'd.f.1': 20,
      'd.f.2': 30,
    })
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
    })
    expect(result).toEqual({
      a: { b: [21, { b2: 26 }] },
      d: [42],
    })
  })
})
