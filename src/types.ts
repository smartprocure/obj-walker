export interface Node {
  key: string | undefined
  val: any
  parents: any[]
  path: string[]
  isLeaf: boolean
  /** Useful for postorder traversals to know when you're at the root. */
  isRoot: boolean
}

export type NextNode = (
  currentNode: Node,
  entry: [string, any],
  isLeaf: (x: any) => boolean
) => Node

export interface Options {
  postOrder?: boolean
  jsonCompat?: boolean
  traverse?(val: any): any
}

export interface WalkOptions extends Options {
  leavesOnly?: boolean
}

export interface MutationOption {
  /** Set to true to modify the object instead of returning a new object. */
  modifyInPlace?: boolean
}

export type MapOptions = Omit<Options, 'traverse'> & {
  shouldSkip?(val: any, node: Node): boolean
  /** Filter which nodes to map over. Only applicable for preorder traversal. */
  filterFn?(val: any, node: Node): boolean
}

export type RefOptions = Pick<Options, 'traverse'>

export type WalkFn = (node: Node) => void
export type AsyncWalkFn = (node: Node) => void | Promise<void>
export type FindFn = (node: Node) => boolean
export type Mapper<T> = (node: Node) => T

export type Walker = (obj: object, walkFn: WalkFn, options?: Options) => void

export type Walk = (obj: object, options?: WalkOptions) => Node[]

export type WalkEach = (
  obj: object,
  walkFn: WalkFn,
  options?: WalkOptions & MutationOption
) => object

export type WalkEachAsync = (
  obj: object,
  walkFn: AsyncWalkFn,
  options?: WalkOptions & MutationOption
) => Promise<object>

export type FindNode = (
  obj: object,
  findFn: FindFn,
  options?: Options
) => Node | undefined

export interface FlattenOptions {
  /** Defaults to '.' */
  separator?: string
  /** Flatten objects and not arrays */
  objectsOnly?: boolean
}

export type Flatten = (
  obj: object,
  options?: WalkOptions & FlattenOptions
) => object

export interface UnflattenOptions {
  /** Defaults to '.' */
  separator?: string | RegExp
}

export type Unflatten = (obj: object, options?: UnflattenOptions) => object

export interface CompactOptions {
  removeUndefined?: boolean
  removeNull?: boolean
  removeEmptyString?: boolean
  removeFalse?: boolean
  removeNaN?: boolean
  removeEmptyObject?: boolean
  removeEmptyArray?: boolean
  compactArrays?: boolean
  removeFn?: (val: any, node: Node) => boolean
}

export type Compact = (
  obj: object,
  options: CompactOptions & MutationOption
) => object

export interface TruncateOptions {
  /** Max allowed depth of objects/arrays. Defaults to Infinity */
  maxDepth?: number
  /** What to replace an object/array at the maximum depth with. Defaults to '[Truncated]' */
  replacementAtMaxDepth?: any
  /** Max allowed length of a string. Defaults to Infinity */
  maxStringLength?: number
  /** What to replace the last characters of the truncated string with. Defaults to '...' */
  replacementAtMaxStringLength?: string
  /** Max allowed length of an array. Defaults to Infinity */
  maxArrayLength?: number
  /** Transform instances of Error into plain objects so that truncation can be performed. Defaults to false */
  transformErrors?: boolean
}

export type Truncate = (
  obj: unknown,
  options: TruncateOptions & MutationOption
) => unknown

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
