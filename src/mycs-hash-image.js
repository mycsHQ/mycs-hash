//
// External dependencies
//
import jsSHA from 'jssha';
import stringifier from './stringify';
import { Validator as V } from 'jsonschema';
const validator = new V();

import shelfSchema from './json-schemas/shelf.json';
import couchtableSchema from './json-schemas/couchtable.json';
import tableSchema from './json-schemas/table-image.json';
import wardrobeSchema from './json-schemas/wardrobe-image.json';
import inputDataSchema from './json-schemas/image-input-data.json';

// should be incremented when releasing a new version
const VERSION = '0.2';
const HASH_ALGORITHM = 'SHA-1';

//
// WARNING !!
// Change this key to easily seed new collection of hashes for same set of structures
// It is recommended to make the version of the lib evolves when you do so
// A consequence is also that the matching with persisted hash (using different lib version) will not work
//
const HMAC_KEY = '0111201600';

//
// Clone deep
//
// @param {object} obj
//
const _cloneDeep = obj => JSON.parse(JSON.stringify(obj));

//
// Validate structure. Json-schema validation
//
// @param {object} structure
//
const _validateStructure = function (structure) {
  const shelfRes = validator.validate(structure, shelfSchema);
  const couchtableRes = validator.validate(structure, couchtableSchema);
  const tableRes = validator.validate(structure, tableSchema);
  const wardrobeRes = validator.validate(structure, wardrobeSchema);

  if (shelfRes.errors.length && couchtableRes.errors.length && tableRes.errors.length && wardrobeRes.errors.length) {
    const error = new Error('structure is invalid for any existing json-schema');
    error.data = {
      structure,
      schemas: {
        shelf: shelfRes.errors,
        couchtable: couchtableRes.errors,
        table: tableRes.errors,
        wardrobe: wardrobeRes.errors
      }
    };

    throw error;
  }
};
//
// Check whether the data structure passes the criteria to be further hashed
//
// @param {object} deserialized json object representing a piece of furniture
//
const _validateInput = function (data) {
  const result = validator.validate(data, inputDataSchema);
  if (result.errors.length) { throw new Error(`invalid input: ${ result.errors }`); }

  if (data.quality !== 'label') { return _validateStructure(data.structure); }
};

//
// @param {object} deserialized json object representing a piece of furniture
//
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

export default hashingFunction;
