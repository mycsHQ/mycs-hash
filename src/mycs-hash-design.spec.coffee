_ = require('lodash')
uuid = require('node-uuid')

describe('test mycs-hash-design furniture structure hashing lib for the mycs project', ->

  hashDesign = require('./mycs-hash-design')

  shelf = require('./data').shelf
  table = require('./data').table
  wardrobe = require('./data').wardrobe
  couchtable = require('./data').couchtable

  testException = (input, keyWords, done) ->

    try
      hashDesign(input)
    catch e
      expect(e.message.indexOf(keyWords) >= 0).toBe(true)
      return done()

    throw new Error("should be throw Exception: #{keyWords}")

  it('should not accept input without structure', (done) ->
    input = {}
    testException(input, 'missing structure', done)
  )

  it('should not accept input with other attributes', (done) ->
    input = _.pick(shelf, ['structure', 'furniture_type', 'camera', 'tags', 'is_label', 'quality'])
    testException(input, 'structure attribute only', done)
  )

  it('should produce the same hash for different attribute order', (done) ->

    table1 = {
      structure: [{
        clegs: {
          back: { sku: 'sku' },
          front_left: { sku: 'sku' },
          front_right: { sku: 'sku' },
        },
        ctop: { sku: 'sku' }
      }]
    }

    table2 = {
      structure: [{
        clegs: {
          front_right: { sku: 'sku' },
          front_left: { sku: 'sku' },
          back: { sku: 'sku' },
        },
        ctop: { sku: 'sku' }
      }]
    }

    expect(hashDesign(table1)).toEqual(hashDesign(table2))
    done()

  )

  it('should produce the expected hash', (done) ->

    input = _.pick(shelf, ['structure'])

    # @todo clarify
    # - this expected hash was flagged in the prod website (4.9.2015)
    # - the hash in the data.json is the one in the prod database the same day
    # There is a discrepancy that should not exist !!!
    # (the hash algorithm probably drifted which is what this lib is meant to prevent)
    expectedHash = '08ac7846587e0e0537c7e7a3b66e92f88309eedc'
    expect(hashDesign(input)).toEqual(expectedHash)
    done()

  )

  it('structure should be valid', (done) ->

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
