import { describe, expect, test } from '@jest/globals'
import { addRefs, deref } from './refs'

describe('addRefs', () => {
  test.only('adds refs', () => {
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
      status: 'completed',
      data: {
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
      },
    }
    const objectWithRefs = addRefs(obj)
    expect(objectWithRefs).toEqual({
      status: 'completed',
      data: {
        api: {
          input: [1, 2, 3],
          output: { '1': 'foo', '2': 'bar', '3': 'baz' },
        },
        details: {
          input: { $ref: '#/data/api/output' },
          output: { '1': 'bla', '2': 'bla', '3': 'bla' },
        },
        writeToDB: { input: { $ref: '#/data/details/output' } },
      },
    })
  })
})

describe('deref', () => {
  test('rehydrates refs', () => {
    const obj = {
      status: 'completed',
      data: {
        api: {
          input: [1, 2, 3],
          output: { '1': 'foo', '2': 'bar', '3': 'baz' },
        },
        details: {
          input: { $ref: '#/data/api/output' },
          output: { '1': 'bla', '2': 'bla', '3': 'bla' },
        },
        writeToDB: { input: { $ref: '#/data/details/output' } },
      },
    }
    expect(deref(obj)).toEqual({
      status: 'completed',
      data: {
        api: {
          input: [1, 2, 3],
          output: { '1': 'foo', '2': 'bar', '3': 'baz' },
        },
        details: {
          input: { '1': 'foo', '2': 'bar', '3': 'baz' },
          output: { '1': 'bla', '2': 'bla', '3': 'bla' },
        },
        writeToDB: { input: { '1': 'bla', '2': 'bla', '3': 'bla' } },
      },
    })
  })
})
