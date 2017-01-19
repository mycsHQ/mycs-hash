import Jasmine from 'jasmine';

var jasmine = new Jasmine();

jasmine.loadConfig({
  spec_dir: 'tests',
  spec_files: [
    '*.spec.js'
  ]
});

jasmine.execute();
