_ = require('lodash')
uuid = require('node-uuid')

describe('test mycs-hash-image furniture structure hashing lib for the mycs project', ->

  hashImage = require('./mycs-hash-image')
  shelf = require('./data')

  testException = (input, keyWords, done) ->

    try
      hashImage(input)
    catch e
      expect(e.message.indexOf(keyWords) >= 0).toBe(true)

    done()

  it('should not accept input without structure', (done) ->
    input = _.pick(shelf, ['camera', 'quality'])
    testException(input, 'structure', done)
  )

  it('should not accept input without camera', (done) ->
    input = _.pick(shelf, ['structure', 'quality'])
    testException(input, 'camera', done)
  )

  it('should not accept input without camera angle', (done) ->
    input = _.pick(shelf, ['structure', 'quality', 'camera'])
    input.camera = {}
    testException(input, 'angle', done)
  )

  it('should not accept input without quality', (done) ->
    input = _.pick(shelf, ['structure', 'camera'])
    testException(input, 'quality', done)
  )

  it('should not accept input with other attributes', (done) ->
    input = _.pick(shelf, ['structure', 'furniture_type', 'camera', 'tags', 'is_label', 'quality'])
    testException(input, 'attributes camera, structure and quality', done)
  )

  it('should produce the same hash for different attribute order', (done) ->

    table1 = {
      camera: { angle: 0 }
      structure: {
        test: 'test'
        test2: 'test2'
        test3: 'test3'
      },
      quality: 'hires'
    }

    table2 = {
      quality: 'hires'
      structure: {
        test3: 'test3'
        test: 'test'
        test2: 'test2'
      }
      camera: { angle: 0 }
    }

    expect(hashImage(table1)).toEqual(hashImage(table2))
    done()

  )

  it('should produce the same hash if camera vAngle attr is missed', (done) ->

    table1 = {
      camera: { angle: 0 }
      structure: {
        test: 'test'
        test2: 'test2'
        test3: 'test3'
      },
      quality: 'hires'
    }

    table2 = {
      quality: 'hires'
      structure: {
        test3: 'test3'
        test: 'test'
        test2: 'test2'
      }
      camera: { angle: 0, vAngle: 0 }
    }

    expect(hashImage(table1)).toEqual(hashImage(table2))
    done()

  )

  it('should produce the expected hash', (done) ->

    input = _.pick(shelf, ['structure', 'camera', 'quality'])

    # @todo clarify
    # - this expected hash was flagged in the prod website (4.9.2015)
    # - the hash in the data.json is the one in the prod database the same day
    # There is a discrepancy that should not exist !!!
    # (the hash algorithm probably drifted which is what this lib is meant to prevent)
    expectedHash = '68a7f65b4fb01d17cafd1e2eefa9818c8ffc6e3b'
    expect(hashImage(input)).toEqual(expectedHash)
    done()

  )

)
