
import _ from 'lodash';
import { Validator as V } from 'jsonschema';

import couchtable from './structures/couchtable.json';
import joyn from './structures/joyn.json';
import shelf from './structures/shelf.json';
import table from './structures/table.json';
import wardrobe from './structures/wardrobe.json';

import couchtableSchema from '../src/json-schemas/couchtable.json';
import genericSchema from '../src/json-schemas/generic-structure.json';
import shelfSchema from '../src/json-schemas/shelf.json';
import tableSchema from '../src/json-schemas/table.json';
import wardrobeSchema from '../src/json-schemas/wardrobe.json';

const validator = new V();

describe('jsonschema library tests', () => {
  it('should structures make pass json-schema validation', () => {
    let res = validator.validate(couchtable.structure, couchtableSchema);
    expect(res.errors.length).toEqual(0);

    res = validator.validate(joyn.structure, genericSchema);
    expect(res.errors.length).toEqual(0);

    res = validator.validate(shelf.structure, shelfSchema);
    expect(res.errors.length).toEqual(0);

    res = validator.validate(table.structure, tableSchema);
    expect(res.errors.length).toEqual(0);

    res = validator.validate(wardrobe.structure, wardrobeSchema);
    expect(res.errors.length).toEqual(0);
  });

  it('should not accept invalid structure', () => {
    const structure = _.cloneDeep(shelf.structure);
    structure.field = {};
    const res = validator.validate(structure, shelfSchema);

    expect(res.errors.length).not.toEqual(0);
    expect(__guard__(res.errors[0], x => x.message)).toEqual('additionalProperty "field" exists in instance when not allowed');
  });

  return it('check compatible pattern for type number', () => {
    let res = validator.validate(3.14, {
      $schema: 'http://json-schema.org/draft-04/schema#',
      type: 'number',
      pattern: '^\\d{1,3}(\\.\\d)*$'
    });
    expect(__guard__(res.errors[0], x => x.message)).toEqual('does not match pattern "^\\\\d{1,3}(\\\\.\\\\d)*$"');

    res = validator.validate(3.1, {
      $schema: 'http://json-schema.org/draft-04/schema#',
      type: 'number',
      pattern: '^\\d{1,3}(\\.\\d)*$'
    });
    expect(res.errors.length).toEqual(0);
  });
});

/**
 * Helper method to validate object paths
 *
 * @param {any} value
 * @param {function} transform
 * @returns {boolean}
 */
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
