import _ from 'lodash';

import stringifier from '../src/stringify';
import shelf from './structures/shelf';


describe('test the stable serialization of javascript objects', () => {
  return it('should create the same stable string as the configurator does', (done) => {
    const expectedString = '{"camera":{"angle":0,"vAngle":0},"quality":"hires","stage":"default","structure":{"columns":[{"boards":[{"position":0.7,"sku":"101.112.00"},{"position":115.9,"sku":"101.112.00"},{"position":154.3,"sku":"101.112.00"},{"position":192.7,"sku":"101.112.00"},{"position":231.1,"sku":"101.112.00"},{"position":39.1,"sku":"101.112.00"},{"position":77.5,"sku":"101.112.00"}],"fronts":[],"position":0,"wallLeft":[{"sku":"101.105.02"}],"wallRight":[{"sku":"101.105.02"}]},{"boards":[{"position":0.7,"sku":"101.112.00"},{"position":115.9,"sku":"101.112.00"},{"position":154.3,"sku":"101.112.00"},{"position":192.7,"sku":"101.112.00"},{"position":231.1,"sku":"101.112.00"},{"position":39.1,"sku":"101.112.00"},{"position":77.5,"sku":"101.112.00"}],"fronts":[],"position":1,"wallLeft":[],"wallRight":[{"sku":"101.105.02"}]},{"boards":[{"position":0.7,"sku":"101.112.00"},{"position":115.9,"sku":"101.112.00"},{"position":154.3,"sku":"101.112.00"},{"position":192.7,"sku":"101.112.00"},{"position":231.1,"sku":"101.112.00"},{"position":39.1,"sku":"101.112.00"},{"position":77.5,"sku":"101.112.00"}],"fronts":[],"position":2,"wallLeft":[],"wallRight":[{"sku":"101.105.02"}]},{"boards":[{"position":0.7,"sku":"101.112.00"},{"position":115.9,"sku":"101.112.00"},{"position":154.3,"sku":"101.112.00"},{"position":192.7,"sku":"101.112.00"},{"position":231.1,"sku":"101.112.00"},{"position":39.1,"sku":"101.112.00"},{"position":77.5,"sku":"101.112.00"}],"fronts":[],"position":3,"wallLeft":[],"wallRight":[{"sku":"101.105.02"}]}]}}';

    expect(stringifier.stringify(shelf)).toEqual(expectedString);
    return done();
  });
});
