/**
 * External dependencies
 */
const jsSHA = require('jssha');
const stringifier = require('./stringify');

/**
 * Should be incremented when releasing a new version
 */
const HASH_ALGORITHM = 'SHA-1';

/**
 * WARNING !!
 * Change this key to easily seed new collection of hashes for same set of structures
 * It is recommended to make the version of the lib evolves when you do so
 * A consequence is also that the matching with persisted hash (using different lib version)
 * will not work
 */
const HMAC_KEY = '0111201600';

/**
 * Clone deep
 *
 * @param {object} obj
 * @returns {object}
 */
const _cloneDeep = obj => JSON.parse(JSON.stringify(obj));

/**
 * Hashing function
 *
 * @param {object} data Deserialized JSON obj representing a piece of furniture
 * @returns {string}
 */
const hashingFunction = function (data) {
  data = _cloneDeep(data);

  // produce the serialized json to be hashed
  const stringToHash = stringifier.stringify(data);

  const shaObj = new jsSHA(HASH_ALGORITHM, 'TEXT');
  shaObj.setHMACKey(HMAC_KEY, 'TEXT');
  shaObj.update(stringToHash);

  return shaObj.getHMAC('HEX');
};

module.exports = hashingFunction;
