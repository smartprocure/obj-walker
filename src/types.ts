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
}

export type RefOptions = Pick<Options, 'traverse'>

export type WalkFn = (node: Node) => void
export type AsyncWalkFn = (node: Node) => void | Promise<void>
export type FindFn = (node: Node) => boolean
export type Mapper = (node: Node) => any

export type Walker = (obj: object, walkFn: WalkFn, options?: Options) => void

export type Walk = (obj: object, options?: WalkOptions) => Node[]

export type Walkie = (
  obj: object,
  walkFn: WalkFn,
  options?: WalkOptions & MutationOption
) => object

export type WalkieAsync = (
  obj: object,
  walkFn: AsyncWalkFn,
  options?: WalkOptions & MutationOption
) => Promise<object>

export type Map = (
  obj: object,
  mapper: Mapper,
  options?: MapOptions & MutationOption
) => object

export type FindNode = (
  obj: object,
  findFn: FindFn,
  options?: Options
) => Node | undefined

export type MapInternal = (
  obj: object,
  mapper: Mapper,
  options: Required<MapOptions>
) => object

export interface FlattenOptions {
  separator?: string
}

export type Flatten = (
  obj: object,
  options?: WalkOptions & FlattenOptions
) => Record<string, any>

export interface CompactOptions {
  removeUndefined?: boolean
  removeNull?: boolean
  removeEmptyString?: boolean
  removeFalse?: boolean
  removeNaN?: boolean
  removeEmptyObject?: boolean
  removeEmptyArray?: boolean
  compactArrays?: boolean
}

export type Compact = (
  obj: object,
  options: CompactOptions & MutationOption
) => object

export interface TruncateOptions {
  depth: number
  /** Defaults to [Truncated] */
  replaceWith?: any
  /** Max length of a string. Default to Infinity. */
  stringLength?: number
  /** Max length of an array */
  arrayLength?: number
}

export type Truncate = (
  obj: object,
  options: TruncateOptions & MutationOption
) => object
