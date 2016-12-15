#
# External dependencies
#
jsSHA = require('jssha')
stringifier = require('./stringify')
V = require('jsonschema').Validator
validator = new V()

shelfSchema = require('./json-schemas/shelf.json')
couchtableSchema = require('./json-schemas/couchtable.json')
tableSchema = require('./json-schemas/table-image.json')
wardrobeSchema = require('./json-schemas/wardrobe-image.json')

# should be incremented when releasing a new version
VERSION = '0.2'
HASH_ALGORITHM = 'SHA-1'

#
# WARNING !!
# Change this key to easily seed new collection of hashes for same set of structures
# It is recommended to make the version of the lib evolves when you do so
# A consequence is also that the matching with persisted hash (using different lib version) will not work
#
HMAC_KEY = '0111201600'

#
# Clone deep
#
# @param {object} obj
#
_cloneDeep = (obj) -> JSON.parse(JSON.stringify(obj))

#
# Validate structure. Json-schema validation
#
# @param {object} structure
#
_validateStructure = (structure) ->
  structure = _cloneDeep(structure)

  shelfRes = validator.validate(structure, shelfSchema)
  couchtableRes = validator.validate(structure, couchtableSchema)
  tableRes = validator.validate(structure, tableSchema)
  wardrobeRes = validator.validate(structure, wardrobeSchema)

  if shelfRes.errors.length and couchtableRes.errors.length and tableRes.errors.length and wardrobeRes.errors.length
    error = {
      structure: structure
      schemas: {
        shelf: shelfRes.errors
        couchtable: couchtableRes.errors
        table: tableRes.errors
        wardrobe: wardrobeRes.errors
      }
    }
    throw new Error('structure is invalid for any existing schema' + JSON.stringify(error, null, 2))

#
# Check whether the data structure passes the criteria to be further hashed
#
# @param {object} deserialized json object representing a piece of furniture
#
_validateData = (data) ->
  unless data.hasOwnProperty('camera')
    throw new Error('missing camera attribute')

  unless data.camera.hasOwnProperty('angle')
    throw new Error('missing angle attribute in camera')

  unless typeof data.camera.angle is 'number' and isFinite(data.camera.angle)
    throw new Error('invalid camera angle')

  # vAngle attr is optional
  if data.camera.hasOwnProperty('vAngle')
    unless typeof data.camera.vAngle is 'number' and isFinite(data.camera.vAngle)
      throw new Error('invalid camera vAngle')

  unless data.hasOwnProperty('quality')
    throw new Error('missing quality attribute')

  unless typeof data.quality is 'string' and data.quality
    throw new Error('invalid quality attribute')

  unless data.hasOwnProperty('stage')
    throw new Error('missing stage attribute')

  unless typeof data.stage is 'string' and data.stage
    throw new Error('invalid stage attribute')

  unless data.hasOwnProperty('structure')
    throw new Error('missing structure attribute')

  unless Object.keys(data).length is 4
    throw new Error('there must exactly be the attributes: camera, structure, stage and quality')

  unless data.quality is 'label'
    _validateStructure(data.structure)

#
# @param {object} deserialized json object representing a piece of furniture
#
hashingFunction = (data) ->
  data = _cloneDeep(data)
  # validate the input
  _validateData(data)

  # Attach attr in order to generate the same hash as for the data with 0 attr
  # TODO: make it required
  data.camera.vAngle = 0 unless data.camera.vAngle?

  # produce the serialized json to be hashed
  stringToHash = stringifier.stringify(data)

  shaObj = new jsSHA(HASH_ALGORITHM, "TEXT")
  shaObj.setHMACKey(HMAC_KEY, "TEXT")
  shaObj.update(stringToHash)
  return shaObj.getHMAC("HEX")

module.exports = hashingFunction
