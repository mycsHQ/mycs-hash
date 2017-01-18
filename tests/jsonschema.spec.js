
import _ from 'lodash';
import { Validator as V } from 'jsonschema';
const validator = new V();

import shelf from './structures/shelf';
import table from './structures/table';
import wardrobe from './structures/wardrobe';
import couchtable from './structures/couchtable';

import shelfSchema from '../src/json-schemas/shelf.json';
import couchtableSchema from '../src/json-schemas/couchtable.json';
import tableSchema from '../src/json-schemas/table.json';
import wardrobeSchema from '../src/json-schemas/wardrobe.json';

describe('jsonschema library tests', () => {
  it('structure should pass json-schema validation', (done) => {
    let res = validator.validate(shelf.structure, shelfSchema);
    expect(res.errors.length).toEqual(0);

    res = validator.validate(table.structure, tableSchema);
    expect(res.errors.length).toEqual(0);

    res = validator.validate(wardrobe.structure, wardrobeSchema);
    expect(res.errors.length).toEqual(0);

    res = validator.validate(couchtable.structure, couchtableSchema);
    expect(res.errors.length).toEqual(0);

    return done();
  });

  it('should not accept invalid structure', (done) => {
    const structure = _.cloneDeep(shelf.structure);
    structure.field = {};
    const res = validator.validate(structure, shelfSchema);

    expect(res.errors.length).not.toEqual(0);
    expect(__guard__(res.errors[0], x => x.message)).toEqual('additionalProperty "field" exists in instance when not allowed');

    return done();
  });

  return it('check compatible pattern for type number', (done) => {
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

    return done();
  });
});
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
