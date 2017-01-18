import _ from 'lodash';
import uuid from 'node-uuid';

import hashDesign from '../src/mycs-hash-design.js';
import shelf from './structures/shelf';


describe('test mycs-hash-design furniture structure hashing lib for the mycs project', () => {
  const testException = function (input, keyWords, done) {
    try {
      hashDesign(input);
    } catch (e) {
      expect(e.message.indexOf(keyWords) >= 0).toBe(true);
      done();
    }

    throw new Error(`should be throw Exception: ${ keyWords }`);
  };

  it('should not accept input without structure', (done) => {
    const input = {};
    return testException(input, 'missing structure', done);
  });

  it('should not accept input with other attributes', (done) => {
    const input = _.pick(shelf, [ 'structure', 'camera', 'quality' ]);
    return testException(input, 'structure attribute only', done);
  });

  it('should produce the same hash for different attribute order', (done) => {
    const struct1 = {
      structure: [ {
        clegs: {
          back: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          front_right: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      } ]
    };

    const struct2 = {
      structure: [ {
        clegs: {
          front_right: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          back: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      } ]
    };

    expect(hashDesign(struct1)).toEqual(hashDesign(struct2));
    return done();
  });

  it('should not accept input with invalid structure', (done) => {
    const input = _.cloneDeep(_.pick(shelf, [ 'structure' ]));
    input.structure.field = {};
    testException(input, 'structure is invalid', done);

    return done();
  });

  return it('should produce the expected hash', (done) => {
    const input = _.pick(shelf, [ 'structure' ]);

    // @todo clarify
    // - this expected hash was flagged in the prod website (4.9.2015)
    // - the hash in the data.json is the one in the prod database the same day
    // There is a discrepancy that should not exist !!!
    // (the hash algorithm probably drifted which is what this lib is meant to prevent)
    const expectedHash = '08ac7846587e0e0537c7e7a3b66e92f88309eedc';
    expect(hashDesign(input)).toEqual(expectedHash);
    return done();
  });
});
