import _ from 'lodash';
import hashDesign from '../src/mycs-hash-design';
import shelf from './structures/shelf.json';


describe('Test mycs-hash-design furniture structure hashing lib for the mycs project', () => {
  it('should produce the same hash for different attribute order', () => {
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
  });

  return it('should produce the expected hash', () => {
    const input = _.pick(shelf, [ 'structure' ]);

    // @todo clarify
    // - this expected hash was flagged in the prod website (4.9.2015)
    // - the hash in the data.json is the one in the prod database the same day
    // There is a discrepancy that should not exist !!!
    // (the hash algorithm probably drifted which is what this lib is meant to prevent)
    const expectedHash = '08ac7846587e0e0537c7e7a3b66e92f88309eedc';
    expect(hashDesign(input)).toEqual(expectedHash);
  });
});
