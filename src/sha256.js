const sha = require('jssha');

module.exports = (stringToHash) => {
  const shaObj = new sha('SHA-256', 'TEXT');
  shaObj.update(stringToHash);
  return shaObj.getHash('HEX');
};
