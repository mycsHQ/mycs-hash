_ = require('lodash')
uuid = require('node-uuid')

describe('test mycs-hash furniture structure hashing lib for the mycs project', ->

  hashlib = require('./mycshash')
  shelf = require('./data')

  hmacKey = uuid.v4()

  testException = (input, keyWords, done) ->
    try
      hashlib(input, hmacKey)
    catch e
      expect(e.message.indexOf(keyWords) >= 0).toBe(true)

    try
      hashlib(input)
    catch e
      expect(e.message.indexOf(keyWords) >= 0).toBe(true)

    done()

  it('should not accept input without structure', (done) ->
    input = _.pick(shelf, ['furniture_type', 'camera'])
    testException(input, 'structure', done)
  )

  it('should not accept input with with is_label to false', (done) ->
    input = _.pick(shelf, ['structure', 'furniture_type', 'camera'])
    input.is_label = false
    testException(input, 'is_label', done)
  )

  it('should not accept input without camera', (done) ->
    input = _.pick(shelf, ['structure', 'furniture_type'])
    testException(input, 'camera', done)
  )

  it('should not accept input without furniture_type', (done) ->
    input = _.pick(shelf, ['structure', 'camera'])
    testException(input, 'furniture_type', done)
  )

  it('should not accept input with other attributes', (done) ->
    input = _.pick(shelf, ['structure', 'furniture_type', 'camera', 'tags', 'is_label'])
    testException(input, 'other attribute', done)
  )

  it('should produce the same hash for different attribute order', (done) ->

    table1 = {
      furniture_type: 'table'
      camera: { angle: 0 }
      structure: {
        test: 'test'
        test2: 'test2'
        test3: 'test3'
      }
    }

    table2 = {
      furniture_type: 'table'
      structure: {
        test3: 'test3'
        test: 'test'
        test2: 'test2'
      }
      camera: { angle: 0 }
    }

    expect(hashlib(table1, hmacKey)).toEqual(hashlib(table2, hmacKey))
    expect(hashlib(table1)).toEqual(hashlib(table2))
    done()

  )

  it('should produce the expected hash', (done) ->

    input = _.pick(shelf, ['structure', 'furniture_type', 'camera'])
    hmacKey = '1903201500'

    # @todo clarify
    # - this expected hash was flagged in the prod website (4.9.2015)
    # - the hash in the data.json is the one in the prod database the same day
    # There is a discrepancy that should not exist !!!
    # (the hash algorithm probably drifted which is what this lib is meant to prevent)
    expectedHash = '907faeaffc31ce0dcf1b519a6a3b3b19bb0a07e8'
    expect(hashlib(input, hmacKey)).toEqual(expectedHash)
    done()

  )

)