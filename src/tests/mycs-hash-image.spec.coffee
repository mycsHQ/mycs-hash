_ = require('lodash')
uuid = require('node-uuid')

describe('test mycs-hash-image furniture structure hashing lib for the mycs project', ->

  hashImage = require('../mycs-hash-image')
  shelf = require('./structures/shelf')

  testException = (input, keyWords, done) ->
    try
      hashImage(input)
    catch e
      expect(e.message.indexOf(keyWords) >= 0).toBe(true)
      done()

    throw new Error("should throw an Exception: #{keyWords}")

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
    input = _.pick(shelf, ['structure', 'camera', 'quality'])
    input.otherAttr = "woohoo"
    testException(input, 'attributes camera, structure and quality', done)
  )

  it('should produce the same hash for different attribute order', (done) ->

    struct1 = {
      camera: { angle: 0 }
      structure: [{
        clegs: {
          back: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          front_right: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      }]
      quality: 'hires'
    }

    struct2 = {
      quality: 'hires'
      structure: [{
        clegs: {
          front_right: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          back: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      }]
      camera: { angle: 0 }
    }

    expect(hashImage(struct1)).toEqual(hashImage(struct2))
    done()

  )

  it('should produce the same hash if camera vAngle attr is missed', (done) ->

    struct1 = {
      camera: { angle: 0 }
      structure: [{
        clegs: {
          back: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          front_right: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      }]
      quality: 'hires'
    }

    struct2 = {
      quality: 'hires'
      structure: [{
        clegs: {
          back: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          front_right: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      }]
      camera: { angle: 0, vAngle: 0 }
    }

    expect(hashImage(struct1)).toEqual(hashImage(struct2))
    done()

  )

  it('should produce the expected hash', (done) ->

    input = _.pick(shelf, ['structure', 'camera', 'quality'])

    # @todo clarify
    # - this expected hash was flagged in the prod website (4.9.2015)
    # - the hash in the data.json is the one in the prod database the same day
    # There is a discrepancy that should not exist !!!
    # (the hash algorithm probably drifted which is what this lib is meant to prevent)
    expectedHash = '9e56d16cbece1d287c039b137f979ea71b1ff285'
    expect(hashImage(input)).toEqual(expectedHash)
    done()

  )

)
