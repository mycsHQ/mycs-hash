_ = require('lodash')



describe('test the stable serialization of javascript objects', ->

  shelf = require('./structures/shelf')
  stringifier = require('../stringify')

  it('should create the same stable string as the configurator does', (done) ->
    expectedString = '{"camera":{"angle":0},"quality":"hires","stage":"default","structure":{"columns":[{"backwalls":[],"boards":[{"position":0.7,"sku":"101.112.00"},{"position":115.9,"sku":"101.112.00"},{"position":154.3,"sku":"101.112.00"},{"position":192.7,"sku":"101.112.00"},{"position":231.1,"sku":"101.112.00"},{"position":39.1,"sku":"101.112.00"},{"position":77.5,"sku":"101.112.00"}],"fronts":[],"handles":[],"legPlatforms":[],"legs":[],"position":0,"wallLeft":[{"sku":"101.105.02"}],"wallRight":[{"sku":"101.105.02"}]},{"backwalls":[],"boards":[{"position":0.7,"sku":"101.112.00"},{"position":115.9,"sku":"101.112.00"},{"position":154.3,"sku":"101.112.00"},{"position":192.7,"sku":"101.112.00"},{"position":231.1,"sku":"101.112.00"},{"position":39.1,"sku":"101.112.00"},{"position":77.5,"sku":"101.112.00"}],"fronts":[],"handles":[],"legPlatforms":[],"legs":[],"position":1,"wallLeft":[],"wallRight":[{"sku":"101.105.02"}]},{"backwalls":[],"boards":[{"position":0.7,"sku":"101.112.00"},{"position":115.9,"sku":"101.112.00"},{"position":154.3,"sku":"101.112.00"},{"position":192.7,"sku":"101.112.00"},{"position":231.1,"sku":"101.112.00"},{"position":39.1,"sku":"101.112.00"},{"position":77.5,"sku":"101.112.00"}],"fronts":[],"handles":[],"legPlatforms":[],"legs":[],"position":2,"wallLeft":[],"wallRight":[{"sku":"101.105.02"}]},{"backwalls":[],"boards":[{"position":0.7,"sku":"101.112.00"},{"position":115.9,"sku":"101.112.00"},{"position":154.3,"sku":"101.112.00"},{"position":192.7,"sku":"101.112.00"},{"position":231.1,"sku":"101.112.00"},{"position":39.1,"sku":"101.112.00"},{"position":77.5,"sku":"101.112.00"}],"fronts":[],"handles":[],"legPlatforms":[],"legs":[],"position":3,"wallLeft":[],"wallRight":[{"sku":"101.105.02"}]}]}}'

    expect(stringifier.stringify(shelf)).toEqual(expectedString)
    done()
  )

)
