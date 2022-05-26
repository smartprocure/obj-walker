declare module 'json-decycle' {
  export const decycle: () => (key: string, value: any) => any
  export const retrocycle: () => (key: string, value: any) => any
}
