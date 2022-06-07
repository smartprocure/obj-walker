export interface Options {
  postOrder?: boolean
  leavesOnly?: boolean
  jsonCompat?: boolean
  traverse?(x: any): any
}

export type RefOptions = Pick<Options, 'traverse'>
export type WOptions = Exclude<Options, 'leavesOnly'>

export interface MapOptions {
  jsonCompat?: boolean
  traverse?(x: any): any
  postFn?: Mapper
}

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
