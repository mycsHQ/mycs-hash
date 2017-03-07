import _ from 'lodash';
import uuid from 'node-uuid';
import hashDesign from '../src/mycs-hash-design.js';
import sydetable from './structures/sydetable';


describe('Sydetable with mycs-hash-design', () => {
  const testException = function (input, keyWords, done) {
    try {
      hashDesign(input);
    } catch (e) {
      expect(e.message.indexOf(keyWords) >= 0).toBe(true);
      done();
    }

    throw new Error(`should be throw Exception: ${ keyWords }`);
  };

  it('should not accept input without structure', done => {
    const input = {};
    testException(input, 'missing structure', done);
  });

  it('should not accept input with invalid attributes', done => {
    const input = _.pick(sydetable, [ 'structure', 'camera', 'quality' ]);
    testException(input, 'structure attribute only', done);
  });

  it('should not accept input with invalid structure', done => {
    const input = _.cloneDeep(_.pick(sydetable, [ 'structure' ]));
    input.structure.field = {};
    testException(input, 'structure is invalid', done);
  });

  it('should accept input with valid structure', () => {
    const input = _.cloneDeep(_.pick(sydetable, [ 'structure' ]));
    expect(hashDesign(input)).toEqual('968e9833e8ce68fcd11aff7aff91867fbe66a125');
  });
});
