export interface Options {
  postOrder?: boolean
  jsonCompat?: boolean
  traverse?(x: any): any
}

export interface WalkOptions extends Options {
  leavesOnly?: boolean
}

export type RefOptions = Pick<Options, 'traverse'>

export interface Node {
  key: string | undefined
  val: any
  parents: any[]
  path: string[]
  isLeaf: boolean
  // Useful for postorder traversals to know when you're at the root
  isRoot: boolean
}

export type WalkFn = (node: Node) => void
export type Mapper = (node: Node) => any
