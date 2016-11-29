_ = require('lodash')
uuid = require('node-uuid')

describe('test mycs-hash-design furniture structure hashing lib for the mycs project', ->

  hashDesign = require('../mycs-hash-design')
  shelf = require('./structures/shelf')
  table = require('./structures/table')
  wardrobe = require('./structures/wardrobe')
  couchtable = require('./structures/couchtable')

  testException = (input, keyWords, done) ->
    try
      hashDesign(input)
    catch e
      expect(e.message.indexOf(keyWords) >= 0).toBe(true)
      done()

    throw new Error("should be throw Exception: #{keyWords}")

  it('should not accept input without structure', (done) ->
    input = {}
    testException(input, 'missing structure', done)
  )

  it('should not accept input with other attributes', (done) ->
    input = _.pick(shelf, ['structure', 'camera', 'quality'])
    testException(input, 'structure attribute only', done)
  )

  it('should produce the same hash for different attribute order', (done) ->

    struct1 = {
      structure: [{
        clegs: {
          back: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          front_right: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      }]
    }

    struct2 = {
      structure: [{
        clegs: {
          front_right: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          back: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      }]
    }

    expect(hashDesign(struct1)).toEqual(hashDesign(struct2))
    done()

  )

  it('should produce the expected hash', (done) ->

    input = _.pick(shelf, ['structure'])

    # @todo clarify
    # - this expected hash was flagged in the prod website (4.9.2015)
    # - the hash in the data.json is the one in the prod database the same day
    # There is a discrepancy that should not exist !!!
    # (the hash algorithm probably drifted which is what this lib is meant to prevent)
    expectedHash = '380989a64d2ff9eb7fc7ab03c109d1c14227bffc'
    expect(hashDesign(input)).toEqual(expectedHash)
    done()

  )

  it('structure should pass json-schema validation', (done) ->

    input = _.pick(shelf, ['structure'])
    hashDesign(input)

    input = _.pick(table, ['structure'])
    hashDesign(input)

    input = _.pick(couchtable, ['structure'])
    hashDesign(input)

    input = _.pick(wardrobe, ['structure'])
    hashDesign(input)

    done()
  )

  it('should not accept input with invalid structure', (done) ->
    input = _.pick(shelf, ['structure'])

    copyInput = _.cloneDeep(input)
    copyInput.structure['field'] = {}
    testException(copyInput, 'structure is invalid', done)

    done()
  )

)
