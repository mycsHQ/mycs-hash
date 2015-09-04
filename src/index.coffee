#
# External dependencies
#
crypto = require('crypto')
stringify = require('json-stable-stringify')

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

  unless data.hasOwnProperty('is_label')
    throw new Error('missing is_label attribute')

  unless data.hasOwnProperty('structure')
    throw new Error('missing structure attribute')

  unless Object.keys(data).length is 4
    throw new Error('there should not be any other attribute than camera, is_label, furniture_type and structure')


#
# @param {object} deserialized json object representing a piece of furniture
# @param {object} (optional) hmac key used as a salt to produce the sha1 hmac hash
#
hashingFunction = (data, hmacKey) ->

  # validate the input
  _validateData(data)

  # produce the serialized json to be hashed
  stringToHash = stringify(data)

  # create the hash
  return crypto.createHmac(HASH_ALGORITHM, hmacKey).update(stringToHash).digest('hex') if hmacKey

  hash = crypto.createHash(HASH_ALGORITHM)
  hash.update(stringToHash)
  toReturn = hash.digest('hex')
  return toReturn


module.exports = hashingFunction