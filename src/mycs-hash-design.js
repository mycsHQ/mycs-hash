/**
 * External dependencies
 */
const jsSHA = require('jssha');
const stringifier = require('./stringify');
const V = require('jsonschema').Validator;

const validator = new V();

const couchtableSchema = require('./json-schemas/couchtable.json');
const shelfSchema = require('./json-schemas/shelf.json');
const sydetableSchema = require('./json-schemas/sydetable.json');
const tableSchema = require('./json-schemas/table.json');
const wardrobeSchema = require('./json-schemas/wardrobe.json');

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
 * @returns {true|error}
 */
const _validateInput = function (data) {
  if (!data.structure) {
    throw new Error('missing structure attribute');
  }

  if (Object.keys(data).length !== 1) {
    throw new Error('there must be structure attribute only');
  }

  return _validateStructure(data.structure);
};

/**
 * Validate structure. Json-schema validation
 *
 * @param {object} structure
 * @returns {true|error}
 */
var _validateStructure = function (structure) {
  const couchtableRes = validator.validate(structure, couchtableSchema);
  const shelfRes = validator.validate(structure, shelfSchema);
  const sydetableRes = validator.validate(structure, sydetableSchema);
  const tableRes = validator.validate(structure, tableSchema);
  const wardrobeRes = validator.validate(structure, wardrobeSchema);

  if (couchtableRes.errors.length
   && shelfRes.errors.length
   && sydetableRes.errors.length
   && tableRes.errors.length
   && wardrobeRes.errors.length) {
    const error = new Error('structure is invalid for any existing json-schema');

    error.data = {
      structure,
      schemas: {
        couchtable: couchtableRes.errors,
        shelf: shelfRes.errors,
        sydetable: sydetableRes.errors,
        table: tableRes.errors,
        wardrobe: wardrobeRes.errors
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
