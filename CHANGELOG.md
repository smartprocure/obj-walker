# 2.5.1

- Fixed issue with `flatten` and the `objectsOnly` option when keys contained alpha and numeric characters.

# 2.5.0

- `exclude` - Exclude one or more paths, optionally using star patterns, from an object.

# 2.4.0

- `truncate` - Handle top-level Error.

# 2.3.0

- `truncate` - Added the ability to pass a function for the `replacementAtMaxStringLength` option.
- Bumped deps and migrated to Vite.

# 2.2.0

- Added `unflatten` to compliment `flatten`.
- Deprecated `walkie`. Use `walkEach`.
- Deprecated `walkieAsync`. Use `walkEachAsync`.

# 2.1.0

- Added handling of top-level scalar values to `size`.

# 2.0.0

- BREAKING CHANGE: Changed API for `truncate` in order to make it more flexible.
- Added `size` for estimating the size in bytes of an object.

# 1.10.0

- Added `removeFn` to `compact` for arbitrary removal.

# 1.9.0

- Added `objectsOnly` option to `flatten`.

# 1.8.0

- Added `modifyInPlace` option for `map`, `walkie`, `walkieAsync`, `mapLeaves`, `compact`, and `truncate`.
- `truncate` supports `Error` objects and can truncate strings and arrays based on the `stringLength` and `arrayLength` options.
- `walker` now supports short-circuiting by returning the exported symbol `SHORT_CIRCUIT`.

# 1.7.0

- Changed `truncate` options from `maxDepth` back to `depth` since `console.dir` uses this name. Also,
  you should probably prefer [dtrim](https://www.npmjs.com/package/dtrim).

# 1.6.0

- Added `walkieAsync` for walking async.

# 1.5.0

- Changed `truncate` options from `depth` to `maxDepth` and allow `replaceWith` to be anything.

# 1.4.0

- Added `truncate` for truncating deep objects.

# 1.3.0

- Make `options` required for `compact`.

# 1.2.0

- Added `compact` for cleaning up objects/arrays.

# 1.1.1

- Apply mapping fn to the root node for preorder and postorder `map`.

# 1.1.0

- Factor out common code.

# 1.0.0

- Remove `traverse` option from all mapping fns.
- `findNode` fn.
- `flatten` fn.

# 0.0.9

- Custom `shouldSkip` fn for `map` and `mapLeaves`.

# 0.0.8

- Deep clone object for `map`. Allow `postOrder` option.

# 0.0.7

- `map` iterates over output.
- Added `walkie`.
- Removed `mapKV`.

# 0.0.6

- Generic `walker` fn.

# 0.0.5

- Renamed argument.

# 0.0.4

- Fixed `traverse` type.

# 0.0.3

- Fixed `traverse` logic.

# 0.0.2

- Fixed bug regarding first-level leaves for `addRefs`.

# 0.0.1

- Initial release.
