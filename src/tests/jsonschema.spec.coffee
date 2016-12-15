
_ = require('lodash')
V = require('jsonschema').Validator
validator = new V()

shelf = require('./structures/shelf')
table = require('./structures/table')
wardrobe = require('./structures/wardrobe')
couchtable = require('./structures/couchtable')

shelfSchema = require('../json-schemas/shelf.json')
couchtableSchema = require('../json-schemas/couchtable.json')
tableSchema = require('../json-schemas/table.json')
wardrobeSchema = require('../json-schemas/wardrobe.json')

describe('jsonschema library tests', ->
  it('structure should pass json-schema validation', (done) ->
    res = validator.validate(shelf.structure, shelfSchema)
    expect(res.errors.length).toEqual(0)

    res = validator.validate(table.structure, tableSchema)
    expect(res.errors.length).toEqual(0)

    res = validator.validate(wardrobe.structure, wardrobeSchema)
    expect(res.errors.length).toEqual(0)

    res = validator.validate(couchtable.structure, couchtableSchema)
    expect(res.errors.length).toEqual(0)

    done()
  )

  it('should not accept invalid structure', (done) ->
    structure = _.cloneDeep(shelf.structure)
    structure.field = {}
    res = validator.validate(structure, shelfSchema)

    expect(res.errors.length).not.toEqual(0)
    expect(res.errors[0]?.message).toEqual('additionalProperty "field" exists in instance when not allowed')

    done()
  )

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