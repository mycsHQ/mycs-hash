#
# External dependencies
#
jsSHA = require('jssha')
stringifier = require('./stringify')

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
  unless data.hasOwnProperty('camera')
    throw new Error('missing camera attribute')

  unless data.camera.hasOwnProperty('angle')
    throw new Error('missing angle attribute in camera')

  unless data.hasOwnProperty('structure')
    throw new Error('missing structure attribute')

  unless data.hasOwnProperty('quality')
    throw new Error('missing quality attribute')

  unless Object.keys(data).length is 3
    throw new Error('there must exactly be the attributes camera, structure and quality')

  # Attach attr in order to generate the same hash as for the data with 0 attr
  data.camera.vAngle = 0 unless data.camera.vAngle?

#
# Clone deep
#
# @param {object} obj
#
_cloneDeep = (obj) -> JSON.parse(JSON.stringify(obj))

#
# @param {object} deserialized json object representing a piece of furniture
#
hashingFunction = (data) ->
  data = _cloneDeep(data)
  # validate the input
  _validateData(data)

  # produce the serialized json to be hashed
  stringToHash = stringifier.stringify(data)

  shaObj = new jsSHA(HASH_ALGORITHM, "TEXT")
  shaObj.setHMACKey(HMAC_KEY, "TEXT")
  shaObj.update(stringToHash)
  return shaObj.getHMAC("HEX")

module.exports = hashingFunction
