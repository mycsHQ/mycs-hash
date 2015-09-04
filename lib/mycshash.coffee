#
# External dependencies
#
crypto = require('crypto')
stringifier = require('./stringify')

HASH_ALGORITHM = 'sha1'

#
# Check whether the data structure passes the criteria to be further hashed
#
# @param {object} deserialized json object representing a piece of furniture
# @return {boolean}
#
_validateData = (data) ->

  unless data.hasOwnProperty('furniture_type')
    throw new Error('missing furniture_type attribute')

  unless data.hasOwnProperty('camera')
    throw new Error('missing camera attribute')

  unless data.hasOwnProperty('structure')
    throw new Error('missing structure attribute')

  unless data.is_label or !data.hasOwnProperty('is_label')
    throw new Error('is_label must be present with true value or not present')

  unless Object.keys(data).length is 4 or Object.keys(data).length is 3 and !data.hasOwnProperty('is_label')
    throw new Error('there should exactly be the attributes camera, furniture_type, structure and optionally is_label')


#
# @param {object} deserialized json object representing a piece of furniture
# @param {object} (optional) hmac key used as a salt to produce the sha1 hmac hash
#
hashingFunction = (data, hmacKey) ->

  # validate the input
  _validateData(data)

  # produce the serialized json to be hashed
  stringToHash = stringifier.stringify(data)

  # create the hash
  return crypto.createHmac(HASH_ALGORITHM, hmacKey).update(stringToHash).digest('hex') if hmacKey

  hash = crypto.createHash(HASH_ALGORITHM)
  hash.update(stringToHash)
  toReturn = hash.digest('hex')
  return toReturn


module.exports = hashingFunction