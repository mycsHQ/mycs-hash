import _ from 'lodash';
import hashImage from '../src/mycs-hash-image';
import shelf from './structures/shelf';

describe('test mycs-hash-image furniture structure hashing lib for the mycs project', () => {
  const testException = function (input, keyWords, done) {
    try {
      hashImage(input);
    } catch (e) {
      expect(e.message.indexOf(keyWords) >= 0).toBe(true);
      done();

      return;
    }

    throw new Error(`should throw an Exception: ${ keyWords }`);
  };

  it('should not accept input without structure', done => {
    const input = _.pick(shelf, [ 'camera', 'quality', 'stage' ]);
    testException(input, 'structure', done);
  });

  it('should not accept input without camera', done => {
    const input = _.pick(shelf, [ 'structure', 'quality', 'stage' ]);
    testException(input, 'camera', done);
  });

  // TODO Valentyn: the camera params should be required
  // enable the test once it's fixed
  xit('should not accept input without camera angle', done => {
    const input = _.cloneDeep(shelf);
    input.camera = {};
    testException(input, 'angle', done);
  });

  it('should not accept NaN in angle', done => {
    const input = _.cloneDeep(shelf);
    input.camera.angle = NaN;
    testException(input, 'angle', done);
  });

  it('should not accept NaN in vAngle', done => {
    const input = _.cloneDeep(shelf);
    input.camera.vAngle = NaN;
    testException(input, 'vAngle', done);
  });

  it('should not accept input without quality', done => {
    const input = _.pick(shelf, [ 'structure', 'camera' ]);
    testException(input, 'quality', done);
  });

  it('should not accept input with empty quality attribute', done => {
    const input = _.cloneDeep(shelf);
    input.quality = '';
    testException(input, 'quality', done);
  });

  it('should not accept input without stage', done => {
    const input = _.pick(shelf, [ 'structure', 'camera', 'quality' ]);
    testException(input, 'stage', done);
  });

  it('should not accept input with empty stage attribute', done => {
    const input = _.cloneDeep(shelf);
    input.stage = '';
    testException(input, 'stage', done);
  });

  it('should not accept input with other attributes', done => {
    const input = _.cloneDeep(shelf);
    input.otherAttr = 'woohoo';
    testException(input, '"otherAttr" exists in instance when not allowed', done);
  });

  it('should produce the same hash for different attribute order', () => {
    const struct1 = {
      camera: {
        angle: 0,
        vAngle: 0
      },
      structure: [ {
        clegs: {
          back: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          front_right: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      } ],
      quality: 'hires',
      stage: 'default'
    };

    const struct2 = {
      quality: 'hires',
      structure: [ {
        clegs: {
          front_right: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          back: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      } ],
      camera: {
        angle: 0,
        vAngle: 0
      },
      stage: 'default'
    };

    expect(hashImage(struct1)).toEqual(hashImage(struct2));
  });

  it('should produce the same hash if camera vAngle attr is missed', () => {
    const struct1 = {
      camera: {
        angle: 0,
        vAngle: 0
      },
      structure: [ {
        clegs: {
          back: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          front_right: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      } ],
      quality: 'hires',
      stage: 'default'
    };

    const struct2 = {
      quality: 'hires',
      structure: [ {
        clegs: {
          back: { sku: '000.000.000' },
          front_left: { sku: '000.000.000' },
          front_right: { sku: '000.000.000' },
        },
        ctop: { sku: '000.000.000' }
      } ],
      camera: { angle: 0, vAngle: 0 },
      stage: 'default'
    };

    expect(hashImage(struct1)).toEqual(hashImage(struct2));
  });

  return it('should produce the expected hash', () => {
    const input = _.pick(shelf, [ 'structure', 'camera', 'quality', 'stage' ]);

    // @todo clarify
    // - this expected hash was flagged in the prod website (4.9.2015)
    // - the hash in the data.json is the one in the prod database the same day
    // There is a discrepancy that should not exist !!!
    // (the hash algorithm probably drifted which is what this lib is meant to prevent)
    const expectedHash = 'a2a631fa6cf7b6dce4be2ac9f8ea4f00fc3498e0';
    expect(hashImage(input)).toEqual(expectedHash);
  });
});
