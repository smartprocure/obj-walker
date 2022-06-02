# obj-walker

Walk objects like this guy.

<img src="./chuck-norris.jpg" alt="Walker, Texas Ranger" width="200"/>

Map over an object in a preorder or postoder depth-first manner.
Also, provides functions for serializing and deserializng
self-referential objects using JSON pointer.

This library is designed to work well with functions that traverse
an object in the same way `JSON.stringify` and `JSON.parse` do. Namely,
preorder and postorder. To mimic that behavior entirely set the `jsonCompat`
option to `true`.

## walker

```typescript
walker(obj: object, walkFn: WalkFn, options: Options = {}) => void
```

Generic walking fn that traverse an object in preorder (default) or postorder,
calling `walkFn` for each node.

```typescript
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
  const parent = parents?.[0]
  if (Array.isArray(val) && key) {
    parent[key] = _.compact(val)
  }
}
walker(obj, walkFn, { postOrder: true })
```

Mutates `obj` producing:

```typescript
{
  a: { b: 23, c: 24 },
  d: { e: 'Bob', f: [10, 30, [31, 32], 40] },
  g: [25, { h: [26, 27] }],
  i: 'Frank',
}
```

## walk

```typescript
walk(obj: object, options: Options = {}) => Node[]
```

Walk an object. Returns an array of all nodes in the object in either
preorder or postorder.

```typescript
import { walk } from 'obj-walker'

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
walk(obj)
```

produces:

```typescript
[
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
  ...
]
```

One of the more interesting uses of `walk` is mutating an object. For example,
below I want to walk a MongoDB JSON schema and set additionalProperties to `true`
wherever it exists. I traverse this tree using a custom `traverse` fn.

```typescript
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
```

## mapLeaves

```typescript
mapLeaves(obj: object, mapper: Mapper, options?: Options) => object
```

where `mapper` receives:

```typescript
export interface Node {
  key: string | undefined
  val: any
  parents: any[]
  path: string[]
  isLeaf: boolean
  isRoot: boolean
}
```

and `options` can be:

```typescript
export interface Options {
  postOrder?: boolean
  leavesOnly?: boolean
  jsonCompat?: boolean
  traverse?(x: any): any
}
```

```typescript
import { mapLeaves } from 'obj-walker'

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
mapLeaves(obj, ({ val }) => val + 1)
```

Produces:

```typescript
{
  a: { b: 24, c: 25 },
  d: { e: 101, f: [11, 21, 31] },
}
```

## mapKV

Map over an object, potentially changing keys and values. You must
return a key/value pair like so `[key, val]`, otherwise the key will
not be written to the return object/array.

```typescript
mapKV(obj: object, mapper: MapperKV, options?: Options) => object

type MapperKV = (node: Node) => [string | undefined, any] | undefined
```

```typescript
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
mapKV(
  obj,
  ({ key, val }) => {
    if (key === 'age') {
      return ['currentAge', val + 1]
    }
    return [key, val]
  },
  { traverse: (x: any) => _.isPlainObject(x) && x }
)
```

produces:

```typescript
{
  bob: { currentAge: 18, scores: [95, 96, 83] },
  joe: { currentAge: 17, scores: [87, 82, 77] },
  frank: { currentAge: 17, scores: [78, 85, 89] },
}
```

## map

Similar to `mapLeaves`, but receives all nodes, not just the leaves.

```typescript
map(obj: object, mapper: Mapper, options?: Options) => object
```

Notice the custom `traverse` fn. This determines how
to traverse into an object or array. By default, we only
traverse into plain objects and arrays and iterate over there
key/value pairs.

```typescript
import { map } from 'obj-walker'

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
map(
  obj,
  ({ val }) => {
    if (Array.isArray(val)) {
      return _.compact(val)
    }
    return val
  },
  { traverse: (x: any) => _.isPlainObject(x) && x }
)
```

produces:

```typescript
{
  a: { b: 23, c: 24 },
  d: { e: 'Bob', f: [10, 30, 40] },
  g: [25],
}
```

## addRefs

```typescript
addRefs(obj: object, options?: RefOptions): object
```

```typescript
import { addRefs } from 'obj-walker'

const apiOutput = {
  1: 'foo',
  2: 'bar',
  3: 'baz',
}

const detailsOutput = {
  1: 'bla',
  2: 'bla',
  3: 'bla',
}

const obj = {
  api: {
    input: [1, 2, 3],
    output: apiOutput,
  },
  details: {
    input: apiOutput,
    output: detailsOutput,
  },
  writeToDB: {
    input: detailsOutput,
  },
}
addRefs(obj)
```

produces:

```typescript
{
  api: {
    input: [1, 2, 3],
    output: { '1': 'foo', '2': 'bar', '3': 'baz' },
  },
  details: {
    input: { $ref: '#/api/output' },
    output: { '1': 'bla', '2': 'bla', '3': 'bla' },
  },
  writeToDB: { input: { $ref: '#/details/output' } },
}
```

## deref

```typescript
deref(obj: object, options?: RefOptions): object
```

```typescript
import { deref } from 'obj-walker'

const obj = {
  api: {
    input: [1, 2, 3],
    output: { '1': 'foo', '2': 'bar', '3': 'baz' },
  },
  details: {
    input: { $ref: '#/api/output' },
    output: { '1': 'bla', '2': 'bla', '3': 'bla' },
  },
  writeToDB: { input: { $ref: '#/details/output' } },
}
deref(obj)
```

produces:

```typescript
{
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
```
