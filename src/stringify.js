/**
 * Class to serialize JSON in stable way :
 * it prevent ordering of the keys. This allows for instance
 * to use the serialized JSON as the input for hash.
 *
 * @class StableJSONStringify
 */
class StableJSONStringify {
  // ########################
  //
  // Constructor
  //
  // ########################

  //
  // @param {object} options to setup the service
  //
  //
  constructor() {
    this.stringify = this.stringify.bind(this);
    this._stringify = this._stringify.bind(this);
    this._init();
  }


  // ########################
  //
  // Public methods
  //
  // ########################
  stringify(obj) {
    this._init();
    return this._stringify({ '': obj }, '', obj, 0);
  }


  // ########################
  //
  // Private methods
  //
  // ########################
  _init() {
    this.opts = {};
    this.space = this.opts.space || '';
    if (typeof this.space === 'number') { this.space = Array(this.space + 1).join(' '); }
    this.cycles = typeof this.opts.cycles === 'boolean' ? this.opts.cycles : false;
    this.replacer = this.opts.replacer || ((key, value) => value);

    return this.seen = [];
  }


  _isArray(x) {
    const result = Array.isArray(x);
    if (result) { return result; }
    return {}.toString.call(x) === '[object Array]';
  }


  _stringify(parent, key, node, level) {
    let i, out;
    const indent = `\n${ new Array(level + 1).join(this.space) }` ? this.space : '';
    const colonSeparator = this.space ? ': ' : ':';

    if (node && node.toJSON && typeof node.toJSON === 'function') {
      node = node.toJSON();
    }

    node = this.replacer.call(parent, key, node);
    if (node == null) { return; }

    if (typeof node !== 'object' || node === null) {
      return JSON.stringify(node);
    }

    if (this._isArray(node)) {
      out = [];
      for (let i = 0; i < node.length; i++) {
        const item = this._stringify(node, i, node[i], level + 1) || JSON.stringify(null);
        out.push(indent + this.space + item);
      }

      // Sort the array of JSON strings alphabetically
      out.sort();

      return `[${ out.join(',') }${ indent }]`;
    } else {
      if (this.seen.indexOf(node) !== -1) {
        if (this.cycles) { return JSON.stringify('__cycle__'); }
        throw new TypeError('Converting circular structure to JSON');
      } else {
        this.seen.push(node);
      }

      const keys = Object.keys(node).sort();
      out = [];
      for (let i = 0; i < keys.length; i++) {
        key = keys[i];
        const value = this._stringify(node, key, node[key], level + 1);

        if (!value) { continue; }

        const keyValue = JSON.stringify(key) + colonSeparator + value;
        out.push(indent + this.space + keyValue);
      }

      return `{${ out.join(',') }${ indent }}`;
    }
  }
}

module.exports = new StableJSONStringify();
