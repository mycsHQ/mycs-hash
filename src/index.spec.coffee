hashlib = require('./')
_ = require('lodash')
shelf = require('./data')
uuid = require('node-uuid')

describe('mycs-hash', ->

  hmacKey = uuid.v4()

  testException = (input, keyWords, done) ->
    try
      hashlib(input, hmacKey)
    catch e
      expect(e.message.indexOf(keyWords) > 0).toBe(true)

    try
      hashlib(input)
    catch e
      expect(e.message.indexOf(keyWords) > 0).toBe(true)

    done()

  it('should not accept input without structure', (done) ->
    input = _.cloneDeep(shelf)
    delete input.structure
    testException(input, 'structure', done)
  )

  it('should not accept input without is_label', (done) ->
    input = _.cloneDeep(shelf)
    delete input.is_label
    testException(input, 'is_label', done)
  )

  it('should not accept input without camera', (done) ->
    input = _.cloneDeep(shelf)
    delete input.camera
    testException(input, 'camera', done)
  )

  it('should not accept input without furniture_type', (done) ->
    input = _.cloneDeep(shelf)
    delete input.furniture_type
    testException(input, 'furniture_type', done)
  )

  it('should not accept input with other attributes', (done) ->

    input = _.cloneDeep(shelf)
    input.test = 'test'
    testException(input, 'other attribute', done)

  )

  it('should produce the same hash for different attribute order', (done) ->

    table1 = {
      furniture_type: 'table'
      camera: { angle: 0 }
      is_label: false
      structure: {
        test: 'test'
        test2: 'test2'
        test3: 'test3'
      }
    }

    table2 = {
      is_label: false
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

)