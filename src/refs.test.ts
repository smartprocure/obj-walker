import { describe, expect, test } from '@jest/globals'
import { addRefs, deref } from './refs'

describe('addRefs', () => {
  test('adds refs', () => {
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
    const objectWithRefs = addRefs(obj)
    expect(objectWithRefs).toEqual({
      api: {
        input: [1, 2, 3],
        output: { '1': 'foo', '2': 'bar', '3': 'baz' },
      },
      details: {
        input: { $ref: '#/api/output' },
        output: { '1': 'bla', '2': 'bla', '3': 'bla' },
      },
      writeToDB: { input: { $ref: '#/details/output' } },
    })
  })
  test('adds refs with custom traverse fn', () => {
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
    const traverse = (x: any) => x.input || x.output
    const objectWithRefs = addRefs(obj, { traverse })
    expect(objectWithRefs).toEqual({
      api: {
        input: [1, 2, 3],
        output: { '1': 'foo', '2': 'bar', '3': 'baz' },
      },
      details: {
        input: { $ref: '#/api/output' },
        output: { '1': 'bla', '2': 'bla', '3': 'bla' },
      },
      writeToDB: { input: { $ref: '#/details/output' } },
    })
  })
})

describe('deref', () => {
  test('rehydrates refs', () => {
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
    expect(deref(obj)).toEqual({
      api: {
        input: [1, 2, 3],
        output: { '1': 'foo', '2': 'bar', '3': 'baz' },
      },
      details: {
        input: { '1': 'foo', '2': 'bar', '3': 'baz' },
        output: { '1': 'bla', '2': 'bla', '3': 'bla' },
      },
      writeToDB: { input: { '1': 'bla', '2': 'bla', '3': 'bla' } },
    })
  })
  test('rehydrates refs with custom traverse fn', () => {
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
    const traverse = (x: any) => x.input || x.output || x.$ref
    expect(deref(obj, { traverse })).toEqual({
      api: {
        input: [1, 2, 3],
        output: { '1': 'foo', '2': 'bar', '3': 'baz' },
      },
      details: {
        input: { '1': 'foo', '2': 'bar', '3': 'baz' },
        output: { '1': 'bla', '2': 'bla', '3': 'bla' },
      },
      writeToDB: { input: { '1': 'bla', '2': 'bla', '3': 'bla' } },
    })
  })
})
