# tree-map

Map over an object in a preorder or postoder depth-first manner.
Also, provides functions for serializing and deserializng
self-referential objects using JSON pointer.

This library is designed to work well with functions that traverse
an object in the same way `JSON.stringify` and `JSON.parse` do. Namely,
preorder and postorder. To mimic that behavior entirely set the `jsonCompat`
option to `true`.

## mapLeaves

```typescript
mapLeaves(obj: object, mapFn: Mapper, options?: Options) => object
```

where `mapFn` receives:

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

```typescript
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

## map

Similar to `mapLeaves`, but receives all nodes, not just the leaves.

```typescript
map(obj: object, mapFn: Mapper, options?: Options) => object
```

```typescript
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
  { traverse: _.isPlainObject }
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
