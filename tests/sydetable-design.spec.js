import _ from 'lodash';
import hashDesign from '../src/mycs-hash-design.js';
import sydetable from './structures/sydetable';


describe('Sydetable with mycs-hash-design', () => {
  it('should accept input with valid structure', () => {
    const input = _.cloneDeep(_.pick(sydetable, [ 'structure' ]));
    expect(hashDesign(input)).toEqual('968e9833e8ce68fcd11aff7aff91867fbe66a125');
  });
});
