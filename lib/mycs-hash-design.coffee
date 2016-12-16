#
# External dependencies
#
jsSHA = require('jssha')
stringifier = require('./stringify')
V = require('jsonschema').Validator
validator = new V()

shelfSchema = require('./json-schemas/shelf.json')
couchtableSchema = require('./json-schemas/couchtable.json')
tableSchema = require('./json-schemas/table.json')
wardrobeSchema = require('./json-schemas/wardrobe.json')

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
# Check whether the data structure passes the criteria to be further hashed
#
# @param {object} deserialized json object representing a piece of furniture
#
_validateInput = (data) ->
  unless data.hasOwnProperty('structure')
    throw new Error('missing structure attribute')

  unless Object.keys(data).length is 1
    throw new Error('there must be structure attribute only')

  _validateStructure(data.structure)

#
# Validate structure. Json-schema validation
#
# @param {object} structure
#
_validateStructure = (structure) ->
  shelfRes = validator.validate(structure, shelfSchema)
  couchtableRes = validator.validate(structure, couchtableSchema)
  tableRes = validator.validate(structure, tableSchema)
  wardrobeRes = validator.validate(structure, wardrobeSchema)

  if shelfRes.errors.length and couchtableRes.errors.length and tableRes.errors.length and wardrobeRes.errors.length
    error = new Error('structure is invalid for any existing json-schema')
    error.data = {
      structure: structure
      schemas: {
        shelf: shelfRes.errors
        couchtable: couchtableRes.errors
        table: tableRes.errors
        wardrobe: wardrobeRes.errors
      }
    }

    throw error

#
# Hashing function
#
# @param {object} data deserialized json object representing a piece of furniture
#
hashingFunction = (data) ->
  data = _cloneDeep(data)

  _validateInput(data)

  # produce the serialized json to be hashed
  stringToHash = stringifier.stringify(data)

  shaObj = new jsSHA(HASH_ALGORITHM, "TEXT")
  shaObj.setHMACKey(HMAC_KEY, "TEXT")
  shaObj.update(stringToHash)
  return shaObj.getHMAC("HEX")

module.exports = hashingFunction
