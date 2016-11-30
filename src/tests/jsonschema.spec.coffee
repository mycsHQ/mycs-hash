_ = require('lodash')
V = require('jsonschema').Validator
validator = new V()

describe('check jsonschema library', ->
  it('check compatible pattern for type number', (done) ->

    res = validator.validate(3.14, {
      '$schema': 'http://json-schema.org/draft-04/schema#',
      'type': 'number',
      'pattern': '^\\d{1,3}(\\.\\d)*$'
    })
    expect(res.errors[0]?.message).toEqual('does not match pattern "^\\\\d{1,3}(\\\\.\\\\d)*$"')

    res = validator.validate(3.1, {
      '$schema': 'http://json-schema.org/draft-04/schema#',
      'type': 'number',
      'pattern': '^\\d{1,3}(\\.\\d)*$'
    })
    expect(res.errors.length).toEqual(0)

    done()
  )
)