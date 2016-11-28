#
# External dependencies
#
jsSHA = require('jssha')
stringifier = require('./stringify')
Validator = require('jsonschema').Validator
v = new Validator()

shelfSchema = require('./schema/shelf-schema.json')
couchTableSchema = require('./schema/couchtable-schema.json')
tableSchema = require('./schema/table-schema.json')
wardrobeSchema = require('./schema/wardrobe-schema.json')

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
# Check whether the data structure passes the criteria to be further hashed
#
# @param {object} deserialized json object representing a piece of furniture
#
_validateData = (data) ->
  unless data.hasOwnProperty('structure')
    throw new Error('missing structure attribute')

  unless Object.keys(data).length is 1
    throw new Error('there must be structure attribute only')

#
# Clone deep
#
# @param {object} obj
#
_cloneDeep = (obj) -> JSON.parse(JSON.stringify(obj))

#
# Check by jsonSchema for all furniture types
#
# @param {object} structure
#
_validateSchema = (structure) ->
  structure = _cloneDeep(structure)

  shelfRes = v.validate(structure, shelfSchema)
  couchTableRes = v.validate(structure, couchTableSchema)
  tableRes = v.validate(structure, tableSchema)
  wardrobeRes = v.validate(structure, wardrobeSchema)

  if shelfRes.errors.length and couchTableRes.errors.length and tableRes.errors.length and wardrobeRes.errors.length
    error = {
      shelf: shelfRes.errors
      couchTable: couchTableRes.errors
      table: tableRes.errors
      wardrobe: wardrobeRes.errors
    }
    throw new Error('structure is invalid for any existing scheme' + JSON.stringify(error, null, 2))

#
# Hashing function
#
# @param {object} data deserialized json object representing a piece of furniture
#
hashingFunction = (data) ->
  data = _cloneDeep(data)
  # validate the input
  _validateData(data)
  _validateSchema(data.structure)

  # produce the serialized json to be hashed
  stringToHash = stringifier.stringify(data)

  shaObj = new jsSHA(HASH_ALGORITHM, "TEXT")
  shaObj.setHMACKey(HMAC_KEY, "TEXT")
  shaObj.update(stringToHash)
  return shaObj.getHMAC("HEX")

module.exports = hashingFunction
