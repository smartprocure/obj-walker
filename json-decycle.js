var decycle = require('json-decycle').decycle
var retrocycle = require('json-decycle').retrocycle

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

const string = JSON.stringify(obj, decycle())
console.log(string)
const parsed = JSON.parse(string, retrocycle())
console.dir(parsed, { depth: 100 })
