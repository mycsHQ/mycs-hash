import Jasmine from 'jasmine';

var jasmine = new Jasmine();

jasmine.loadConfig({
  isVerbose: true,
  spec_dir: 'tests',
  spec_files: [
    '*.spec.js'
  ]
});

jasmine.onComplete(passed => {
  if (passed) {
    process.stdout.write('✅  All good.');
  } else {
    process.stdout.write('🔥  At least one test has failed');
  }
});

jasmine.execute();
