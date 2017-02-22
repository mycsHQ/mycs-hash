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

  it('should not accept input without structure', (done) => {
    const input = {};
    return testException(input, 'missing structure', done);
  });

  it('should not accept input with other attributes', (done) => {
    const input = _.pick(sydetable, [ 'structure', 'camera', 'quality' ]);
    return testException(input, 'structure attribute only', done);
  });
});
