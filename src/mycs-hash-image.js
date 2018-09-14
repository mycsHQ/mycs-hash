/**
 * External dependencies
 */
const jsSHA = require('jssha');
const stringifier = require('./stringify');
const V = require('jsonschema').Validator;

const validator = new V();
const inputDataSchema = require('./json-schemas/image-input-data.json');

const genericSchema = require('./json-schemas/generic-structure.json');

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
 * Check whether the data structure passes the criteria to be further hashed
 *
 * @param {object} data json object representing a piece of furniture
 * @returns {mixed}
 */
const _validateInput = function (data) {
  const result = validator.validate(data, inputDataSchema);

  if (result.errors.length) {
    throw new Error(`invalid input: ${ result.errors }`);
  }

  // TODO add better validation
  // for new generation structures
  if (data.structure.props) {
    return;
  }

  if (data.quality !== 'label') {
    return _validateStructure(data.structure);
  }
};

/**
 * Validate structure. Json-schema validation
 *
 * @param {object} structure
 * @returns {true|error}
 */
const _validateStructure = function (structure) {
  const genericRes = validator.validate(structure, genericSchema);

  if (genericRes.errors.length) {
    const error = new Error('structure is invalid for any existing image json-schema');

    error.data = {
      structure,
      schemas: {
        generic: genericRes.errors
      }
    };

    throw error;
  }

  return true;
};

/**
 * Hashing function
 *
 * @param {object} data Deserialized JSON obj representing a piece of furniture
 * @returns {string}
 */
const hashingFunction = function (data) {
  data = _cloneDeep(data);

  _validateInput(data);

  // produce the serialized json to be hashed
  const stringToHash = stringifier.stringify(data);

  const shaObj = new jsSHA(HASH_ALGORITHM, 'TEXT');
  shaObj.setHMACKey(HMAC_KEY, 'TEXT');
  shaObj.update(stringToHash);

  return shaObj.getHMAC('HEX');
};

module.exports = hashingFunction;
