require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var helpers = require('./helpers');

/** @type ValidatorResult */
var ValidatorResult = helpers.ValidatorResult;
/** @type SchemaError */
var SchemaError = helpers.SchemaError;

var attribute = {};

attribute.ignoreProperties = {
  // informative properties
  'id': true,
  'default': true,
  'description': true,
  'title': true,
  // arguments to other properties
  'exclusiveMinimum': true,
  'exclusiveMaximum': true,
  'additionalItems': true,
  // special-handled properties
  '$schema': true,
  '$ref': true,
  'extends': true
};

/**
 * @name validators
 */
var validators = attribute.validators = {};

/**
 * Validates whether the instance if of a certain type
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {ValidatorResult|null}
 */
validators.type = function validateType (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (!types.some(this.testType.bind(this, instance, schema, options, ctx))) {
    var list = types.map(function (v) {
      return v.id && ('<' + v.id + '>') || (v+'');
    });
    result.addError({
      name: 'type',
      argument: list,
      message: "is not of a type(s) " + list,
    });
  }
  return result;
};

function testSchema(instance, options, ctx, callback, schema){
  var res = this.validateSchema(instance, schema, options, ctx);
  if (! res.valid && callback instanceof Function) {
    callback(res);
  }
  return res.valid;
}

/**
 * Validates whether the instance matches some of the given schemas
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {ValidatorResult|null}
 */
validators.anyOf = function validateAnyOf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var inner = new ValidatorResult(instance, schema, options, ctx);
  if (!Array.isArray(schema.anyOf)){
    throw new SchemaError("anyOf must be an array");
  }
  if (!schema.anyOf.some(
    testSchema.bind(
      this, instance, options, ctx, function(res){inner.importErrors(res);}
      ))) {
    var list = schema.anyOf.map(function (v, i) {
      return (v.id && ('<' + v.id + '>')) || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
    });
    if (options.nestedErrors) {
      result.importErrors(inner);
    }
    result.addError({
      name: 'anyOf',
      argument: list,
      message: "is not any of " + list.join(','),
    });
  }
  return result;
};

/**
 * Validates whether the instance matches every given schema
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.allOf = function validateAllOf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  if (!Array.isArray(schema.allOf)){
    throw new SchemaError("allOf must be an array");
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var self = this;
  schema.allOf.forEach(function(v, i){
    var valid = self.validateSchema(instance, v, options, ctx);
    if(!valid.valid){
      var msg = (v.id && ('<' + v.id + '>')) || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
      result.addError({
        name: 'allOf',
        argument: { id: msg, length: valid.errors.length, valid: valid },
        message: 'does not match allOf schema ' + msg + ' with ' + valid.errors.length + ' error[s]:',
      });
      result.importErrors(valid);
    }
  });
  return result;
};

/**
 * Validates whether the instance matches exactly one of the given schemas
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.oneOf = function validateOneOf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  if (!Array.isArray(schema.oneOf)){
    throw new SchemaError("oneOf must be an array");
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var inner = new ValidatorResult(instance, schema, options, ctx);
  var count = schema.oneOf.filter(
    testSchema.bind(
      this, instance, options, ctx, function(res) {inner.importErrors(res);}
      ) ).length;
  var list = schema.oneOf.map(function (v, i) {
    return (v.id && ('<' + v.id + '>')) || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
  });
  if (count!==1) {
    if (options.nestedErrors) {
      result.importErrors(inner);
    }
    result.addError({
      name: 'oneOf',
      argument: list,
      message: "is not exactly one from " + list.join(','),
    });
  }
  return result;
};

/**
 * Validates properties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.properties = function validateProperties (instance, schema, options, ctx) {
  if(instance === undefined || !(instance instanceof Object)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var properties = schema.properties || {};
  for (var property in properties) {
    var prop = (instance || undefined) && instance[property];
    var res = this.validateSchema(prop, properties[property], options, ctx.makeChild(properties[property], property));
    if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
    result.importErrors(res);
  }
  return result;
};

/**
 * Test a specific property within in instance against the additionalProperties schema attribute
 * This ignores properties with definitions in the properties schema attribute, but no other attributes.
 * If too many more types of property-existance tests pop up they may need their own class of tests (like `type` has)
 * @private
 * @return {boolean}
 */
function testAdditionalProperty (instance, schema, options, ctx, property, result) {
  if (schema.properties && schema.properties[property] !== undefined) {
    return;
  }
  if (schema.additionalProperties === false) {
    result.addError({
      name: 'additionalProperties',
      argument: property,
      message: "additionalProperty " + JSON.stringify(property) + " exists in instance when not allowed",
    });
  } else {
    var additionalProperties = schema.additionalProperties || {};
    var res = this.validateSchema(instance[property], additionalProperties, options, ctx.makeChild(additionalProperties, property));
    if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
    result.importErrors(res);
  }
}

/**
 * Validates patternProperties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.patternProperties = function validatePatternProperties (instance, schema, options, ctx) {
  if(instance === undefined) return;
  if(!this.types.object(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var patternProperties = schema.patternProperties || {};

  for (var property in instance) {
    var test = true;
    for (var pattern in patternProperties) {
      var expr = new RegExp(pattern);
      if (!expr.test(property)) {
        continue;
      }
      test = false;
      var res = this.validateSchema(instance[property], patternProperties[pattern], options, ctx.makeChild(patternProperties[pattern], property));
      if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
      result.importErrors(res);
    }
    if (test) {
      testAdditionalProperty.call(this, instance, schema, options, ctx, property, result);
    }
  }

  return result;
};

/**
 * Validates additionalProperties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.additionalProperties = function validateAdditionalProperties (instance, schema, options, ctx) {
  if(instance === undefined) return;
  if(!this.types.object(instance)) return;
  // if patternProperties is defined then we'll test when that one is called instead
  if (schema.patternProperties) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  for (var property in instance) {
    testAdditionalProperty.call(this, instance, schema, options, ctx, property, result);
  }
  return result;
};

/**
 * Validates whether the instance value is at least of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minProperties = function validateMinProperties (instance, schema, options, ctx) {
  if (!instance || typeof instance !== 'object') {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var keys = Object.keys(instance);
  if (!(keys.length >= schema.minProperties)) {
    result.addError({
      name: 'minProperties',
      argument: schema.minProperties,
      message: "does not meet minimum property length of " + schema.minProperties,
    })
  }
  return result;
};

/**
 * Validates whether the instance value is at most of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxProperties = function validateMaxProperties (instance, schema, options, ctx) {
  if (!instance || typeof instance !== 'object') {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var keys = Object.keys(instance);
  if (!(keys.length <= schema.maxProperties)) {
    result.addError({
      name: 'maxProperties',
      argument: schema.maxProperties,
      message: "does not meet maximum property length of " + schema.maxProperties,
    });
  }
  return result;
};

/**
 * Validates items when instance is an array
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.items = function validateItems (instance, schema, options, ctx) {
  if (!Array.isArray(instance)) {
    return null;
  }
  var self = this;
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (instance === undefined || !schema.items) {
    return result;
  }
  instance.every(function (value, i) {
    var items = Array.isArray(schema.items) ? (schema.items[i] || schema.additionalItems) : schema.items;
    if (items === undefined) {
      return true;
    }
    if (items === false) {
      result.addError({
        name: 'items',
        message: "additionalItems not permitted",
      });
      return false;
    }
    var res = self.validateSchema(value, items, options, ctx.makeChild(items, i));
    if(res.instance !== result.instance[i]) result.instance[i] = res.instance;
    result.importErrors(res);
    return true;
  });
  return result;
};

/**
 * Validates minimum and exclusiveMinimum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minimum = function validateMinimum (instance, schema, options, ctx) {
  if (typeof instance !== 'number') {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var valid = true;
  if (schema.exclusiveMinimum && schema.exclusiveMinimum === true) {
    valid = instance > schema.minimum;
  } else {
    valid = instance >= schema.minimum;
  }
  if (!valid) {
    result.addError({
      name: 'minimum',
      argument: schema.minimum,
      message: "must have a minimum value of " + schema.minimum,
    });
  }
  return result;
};

/**
 * Validates maximum and exclusiveMaximum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maximum = function validateMaximum (instance, schema, options, ctx) {
  if (typeof instance !== 'number') {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var valid;
  if (schema.exclusiveMaximum && schema.exclusiveMaximum === true) {
    valid = instance < schema.maximum;
  } else {
    valid = instance <= schema.maximum;
  }
  if (!valid) {
    result.addError({
      name: 'maximum',
      argument: schema.maximum,
      message: "must have a maximum value of " + schema.maximum,
    });
  }
  return result;
};

/**
 * Validates divisibleBy when the type of the instance value is a number.
 * Of course, this is susceptible to floating point error since it compares the floating points
 * and not the JSON byte sequences to arbitrary precision.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.divisibleBy = function validateDivisibleBy (instance, schema, options, ctx) {
  if (typeof instance !== 'number') {
    return null;
  }

  if (schema.divisibleBy == 0) {
    throw new SchemaError("divisibleBy cannot be zero");
  }

  var result = new ValidatorResult(instance, schema, options, ctx);
  if (instance / schema.divisibleBy % 1) {
    result.addError({
      name: 'divisibleBy',
      argument: schema.divisibleBy,
      message: "is not divisible by (multiple of) " + JSON.stringify(schema.divisibleBy),
    });
  }
  return result;
};

/**
 * Validates divisibleBy when the type of the instance value is a number.
 * Of course, this is susceptible to floating point error since it compares the floating points
 * and not the JSON byte sequences to arbitrary precision.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.multipleOf = function validateMultipleOf (instance, schema, options, ctx) {
  if (typeof instance !== 'number') {
    return null;
  }

  if (schema.multipleOf == 0) {
    throw new SchemaError("multipleOf cannot be zero");
  }

  var result = new ValidatorResult(instance, schema, options, ctx);
  if (instance / schema.multipleOf % 1) {
    result.addError({
      name: 'multipleOf',
      argument:  schema.multipleOf,
      message: "is not a multiple of (divisible by) " + JSON.stringify(schema.multipleOf),
    });
  }
  return result;
};

/**
 * Validates whether the instance value is present.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.required = function validateRequired (instance, schema, options, ctx) {
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (instance === undefined && schema.required === true) {
    result.addError({
      name: 'required',
      message: "is required"
    });
  } else if (instance && typeof instance==='object' && Array.isArray(schema.required)) {
    schema.required.forEach(function(n){
      if(instance[n]===undefined){
        result.addError({
          name: 'required',
          argument: n,
          message: "requires property " + JSON.stringify(n),
        });
      }
    });
  }
  return result;
};

/**
 * Validates whether the instance value matches the regular expression, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.pattern = function validatePattern (instance, schema, options, ctx) {
  if (typeof instance !== 'string' && typeof instance !== 'number') {
    return null;
  }
  if (typeof instance === 'number') {
    instance = instance.toString();
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!instance.match(schema.pattern)) {
    result.addError({
      name: 'pattern',
      argument: schema.pattern,
      message: "does not match pattern " + JSON.stringify(schema.pattern),
    });
  }
  return result;
};

/**
 * Validates whether the instance value is of a certain defined format or a custom
 * format.
 * The following formats are supported for string types:
 *   - date-time
 *   - date
 *   - time
 *   - ip-address
 *   - ipv6
 *   - uri
 *   - color
 *   - host-name
 *   - alpha
 *   - alpha-numeric
 *   - utc-millisec
 * @param instance
 * @param schema
 * @param [options]
 * @param [ctx]
 * @return {String|null}
 */
validators.format = function validateFormat (instance, schema, options, ctx) {
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!result.disableFormat && !helpers.isFormat(instance, schema.format, this)) {
    result.addError({
      name: 'format',
      argument: schema.format,
      message: "does not conform to the " + JSON.stringify(schema.format) + " format",
    });
  }
  return result;
};

/**
 * Validates whether the instance value is at least of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minLength = function validateMinLength (instance, schema, options, ctx) {
  if (!(typeof instance === 'string')) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!(instance.length >= schema.minLength)) {
    result.addError({
      name: 'minLength',
      argument: schema.minLength,
      message: "does not meet minimum length of " + schema.minLength,
    });
  }
  return result;
};

/**
 * Validates whether the instance value is at most of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxLength = function validateMaxLength (instance, schema, options, ctx) {
  if (!(typeof instance === 'string')) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!(instance.length <= schema.maxLength)) {
    result.addError({
      name: 'maxLength',
      argument: schema.maxLength,
      message: "does not meet maximum length of " + schema.maxLength,
    });
  }
  return result;
};

/**
 * Validates whether instance contains at least a minimum number of items, when the instance is an Array.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minItems = function validateMinItems (instance, schema, options, ctx) {
  if (!Array.isArray(instance)) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!(instance.length >= schema.minItems)) {
    result.addError({
      name: 'minItems',
      argument: schema.minItems,
      message: "does not meet minimum length of " + schema.minItems,
    });
  }
  return result;
};

/**
 * Validates whether instance contains no more than a maximum number of items, when the instance is an Array.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxItems = function validateMaxItems (instance, schema, options, ctx) {
  if (!Array.isArray(instance)) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!(instance.length <= schema.maxItems)) {
    result.addError({
      name: 'maxItems',
      argument: schema.maxItems,
      message: "does not meet maximum length of " + schema.maxItems,
    });
  }
  return result;
};

/**
 * Validates that every item in an instance array is unique, when instance is an array
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.uniqueItems = function validateUniqueItems (instance, schema, options, ctx) {
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!Array.isArray(instance)) {
    return result;
  }
  function testArrays (v, i, a) {
    for (var j = i + 1; j < a.length; j++) if (helpers.deepCompareStrict(v, a[j])) {
      return false;
    }
    return true;
  }
  if (!instance.every(testArrays)) {
    result.addError({
      name: 'uniqueItems',
      message: "contains duplicate item",
    });
  }
  return result;
};

/**
 * Deep compares arrays for duplicates
 * @param v
 * @param i
 * @param a
 * @private
 * @return {boolean}
 */
function testArrays (v, i, a) {
  var j, len = a.length;
  for (j = i + 1, len; j < len; j++) {
    if (helpers.deepCompareStrict(v, a[j])) {
      return false;
    }
  }
  return true;
}

/**
 * Validates whether there are no duplicates, when the instance is an Array.
 * @param instance
 * @return {String|null}
 */
validators.uniqueItems = function validateUniqueItems (instance, schema, options, ctx) {
  if (!Array.isArray(instance)) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!instance.every(testArrays)) {
    result.addError({
      name: 'uniqueItems',
      message: "contains duplicate item",
    });
  }
  return result;
};

/**
 * Validate for the presence of dependency properties, if the instance is an object.
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {null|ValidatorResult}
 */
validators.dependencies = function validateDependencies (instance, schema, options, ctx) {
  if (!instance || typeof instance != 'object') {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  for (var property in schema.dependencies) {
    if (instance[property] === undefined) {
      continue;
    }
    var dep = schema.dependencies[property];
    var childContext = ctx.makeChild(dep, property);
    if (typeof dep == 'string') {
      dep = [dep];
    }
    if (Array.isArray(dep)) {
      dep.forEach(function (prop) {
        if (instance[prop] === undefined) {
          result.addError({
            // FIXME there's two different "dependencies" errors here with slightly different outputs
            // Can we make these the same? Or should we create different error types?
            name: 'dependencies',
            argument: childContext.propertyPath,
            message: "property " + prop + " not found, required by " + childContext.propertyPath,
          });
        }
      });
    } else {
      var res = this.validateSchema(instance, dep, options, childContext);
      if(result.instance !== res.instance) result.instance = res.instance;
      if (res && res.errors.length) {
        result.addError({
          name: 'dependencies',
          argument: childContext.propertyPath,
          message: "does not meet dependency required by " + childContext.propertyPath,
        });
        result.importErrors(res);
      }
    }
  }
  return result;
};

/**
 * Validates whether the instance value is one of the enumerated values.
 *
 * @param instance
 * @param schema
 * @return {ValidatorResult|null}
 */
validators['enum'] = function validateEnum (instance, schema, options, ctx) {
  if (!Array.isArray(schema['enum'])) {
    throw new SchemaError("enum expects an array", schema);
  }
  if (instance === undefined) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!schema['enum'].some(helpers.deepCompareStrict.bind(null, instance))) {
    result.addError({
      name: 'enum',
      argument: schema['enum'],
      message: "is not one of enum values: " + schema['enum'].join(','),
    });
  }
  return result;
};

/**
 * Validates whether the instance if of a prohibited type.
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {null|ValidatorResult}
 */
validators.not = validators.disallow = function validateNot (instance, schema, options, ctx) {
  var self = this;
  if(instance===undefined) return null;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var notTypes = schema.not || schema.disallow;
  if(!notTypes) return null;
  if(!Array.isArray(notTypes)) notTypes=[notTypes];
  notTypes.forEach(function (type) {
    if (self.testType(instance, schema, options, ctx, type)) {
      var schemaId = type && type.id && ('<' + type.id + '>') || type;
      result.addError({
        name: 'not',
        argument: schemaId,
        message: "is of prohibited type " + schemaId,
      });
    }
  });
  return result;
};

module.exports = attribute;

},{"./helpers":2}],2:[function(require,module,exports){
'use strict';

var uri = require('url');

var ValidationError = exports.ValidationError = function ValidationError (message, instance, schema, propertyPath, name, argument) {
  if (propertyPath) {
    this.property = propertyPath;
  }
  if (message) {
    this.message = message;
  }
  if (schema) {
    if (schema.id) {
      this.schema = schema.id;
    } else {
      this.schema = schema;
    }
  }
  if (instance) {
    this.instance = instance;
  }
  this.name = name;
  this.argument = argument;
  this.stack = this.toString();
};

ValidationError.prototype.toString = function toString() {
  return this.property + ' ' + this.message;
};

var ValidatorResult = exports.ValidatorResult = function ValidatorResult(instance, schema, options, ctx) {
  this.instance = instance;
  this.schema = schema;
  this.propertyPath = ctx.propertyPath;
  this.errors = [];
  this.throwError = options && options.throwError;
  this.disableFormat = options && options.disableFormat === true;
};

ValidatorResult.prototype.addError = function addError(detail) {
  var err;
  if (typeof detail == 'string') {
    err = new ValidationError(detail, this.instance, this.schema, this.propertyPath);
  } else {
    if (!detail) throw new Error('Missing error detail');
    if (!detail.message) throw new Error('Missing error message');
    if (!detail.name) throw new Error('Missing validator type');
    err = new ValidationError(detail.message, this.instance, this.schema, this.propertyPath, detail.name, detail.argument);
  }

  if (this.throwError) {
    throw err;
  }
  this.errors.push(err);
  return err;
};

ValidatorResult.prototype.importErrors = function importErrors(res) {
  if (typeof res == 'string' || (res && res.validatorType)) {
    this.addError(res);
  } else if (res && res.errors) {
    Array.prototype.push.apply(this.errors, res.errors);
  }
};

function stringizer (v,i){
  return i+': '+v.toString()+'\n';
}
ValidatorResult.prototype.toString = function toString(res) {
  return this.errors.map(stringizer).join('');
};

Object.defineProperty(ValidatorResult.prototype, "valid", { get: function() {
  return !this.errors.length;
} });

/**
 * Describes a problem with a Schema which prevents validation of an instance
 * @name SchemaError
 * @constructor
 */
var SchemaError = exports.SchemaError = function SchemaError (msg, schema) {
  this.message = msg;
  this.schema = schema;
  Error.call(this, msg);
  Error.captureStackTrace(this, SchemaError);
};
SchemaError.prototype = Object.create(Error.prototype,
  { constructor: {value: SchemaError, enumerable: false}
  , name: {value: 'SchemaError', enumerable: false}
  });

var SchemaContext = exports.SchemaContext = function SchemaContext (schema, options, propertyPath, base, schemas) {
  this.schema = schema;
  this.options = options;
  this.propertyPath = propertyPath;
  this.base = base;
  this.schemas = schemas;
};

SchemaContext.prototype.resolve = function resolve (target) {
  return uri.resolve(this.base, target);
};

SchemaContext.prototype.makeChild = function makeChild(schema, propertyName){
  var propertyPath = (propertyName===undefined) ? this.propertyPath : this.propertyPath+makeSuffix(propertyName);
  var base = uri.resolve(this.base, schema.id||'');
  var ctx = new SchemaContext(schema, this.options, propertyPath, base, Object.create(this.schemas));
  if(schema.id && !ctx.schemas[base]){
    ctx.schemas[base] = schema;
  }
  return ctx;
}

var FORMAT_REGEXPS = exports.FORMAT_REGEXPS = {
  'date-time': /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))$/,
  'date': /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])$/,
  'time': /^(2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])$/,

  'email': /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/,
  'ip-address': /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  'ipv6': /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/,
  'uri': /^[a-zA-Z][a-zA-Z0-9+-.]*:[^\s]*$/,

  'color': /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/,

  // hostname regex from: http://stackoverflow.com/a/1420225/5628
  'hostname': /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/,
  'host-name': /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/,

  'alpha': /^[a-zA-Z]+$/,
  'alphanumeric': /^[a-zA-Z0-9]+$/,
  'utc-millisec': function (input) {
    return (typeof input === 'string') && parseFloat(input) === parseInt(input, 10) && !isNaN(input);
  },
  'regex': function (input) {
    var result = true;
    try {
      new RegExp(input);
    } catch (e) {
      result = false;
    }
    return result;
  },
  'style': /\s*(.+?):\s*([^;]+);?/g,
  'phone': /^\+(?:[0-9] ?){6,14}[0-9]$/
};

FORMAT_REGEXPS.regexp = FORMAT_REGEXPS.regex;
FORMAT_REGEXPS.pattern = FORMAT_REGEXPS.regex;
FORMAT_REGEXPS.ipv4 = FORMAT_REGEXPS['ip-address'];

exports.isFormat = function isFormat (input, format, validator) {
  if (typeof input === 'string' && FORMAT_REGEXPS[format] !== undefined) {
    if (FORMAT_REGEXPS[format] instanceof RegExp) {
      return FORMAT_REGEXPS[format].test(input);
    }
    if (typeof FORMAT_REGEXPS[format] === 'function') {
      return FORMAT_REGEXPS[format](input);
    }
  } else if (validator && validator.customFormats &&
      typeof validator.customFormats[format] === 'function') {
    return validator.customFormats[format](input);
  }
  return true;
};

var makeSuffix = exports.makeSuffix = function makeSuffix (key) {
  key = key.toString();
  // This function could be capable of outputting valid a ECMAScript string, but the
  // resulting code for testing which form to use would be tens of thousands of characters long
  // That means this will use the name form for some illegal forms
  if (!key.match(/[.\s\[\]]/) && !key.match(/^[\d]/)) {
    return '.' + key;
  }
  if (key.match(/^\d+$/)) {
    return '[' + key + ']';
  }
  return '[' + JSON.stringify(key) + ']';
};

exports.deepCompareStrict = function deepCompareStrict (a, b) {
  if (typeof a !== typeof b) {
    return false;
  }
  if (a instanceof Array) {
    if (!(b instanceof Array)) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    return a.every(function (v, i) {
      return deepCompareStrict(a[i], b[i]);
    });
  }
  if (typeof a === 'object') {
    if (!a || !b) {
      return a === b;
    }
    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every(function (v) {
      return deepCompareStrict(a[v], b[v]);
    });
  }
  return a === b;
};

function deepMerger (target, dst, e, i) {
  if (typeof e === 'object') {
    dst[i] = deepMerge(target[i], e)
  } else {
    if (target.indexOf(e) === -1) {
      dst.push(e)
    }
  }
}

function copyist (src, dst, key) {
  dst[key] = src[key];
}

function copyistWithDeepMerge (target, src, dst, key) {
  if (typeof src[key] !== 'object' || !src[key]) {
    dst[key] = src[key];
  }
  else {
    if (!target[key]) {
      dst[key] = src[key];
    } else {
      dst[key] = deepMerge(target[key], src[key])
    }
  }
}

function deepMerge (target, src) {
  var array = Array.isArray(src);
  var dst = array && [] || {};

  if (array) {
    target = target || [];
    dst = dst.concat(target);
    src.forEach(deepMerger.bind(null, target, dst));
  } else {
    if (target && typeof target === 'object') {
      Object.keys(target).forEach(copyist.bind(null, target, dst));
    }
    Object.keys(src).forEach(copyistWithDeepMerge.bind(null, target, src, dst));
  }

  return dst;
};

module.exports.deepMerge = deepMerge;

/**
 * Validates instance against the provided schema
 * Implements URI+JSON Pointer encoding, e.g. "%7e"="~0"=>"~", "~1"="%2f"=>"/"
 * @param o
 * @param s The path to walk o along
 * @return any
 */
exports.objectGetPath = function objectGetPath(o, s) {
  var parts = s.split('/').slice(1);
  var k;
  while (typeof (k=parts.shift()) == 'string') {
    var n = decodeURIComponent(k.replace(/~0/,'~').replace(/~1/g,'/'));
    if (!(n in o)) return;
    o = o[n];
  }
  return o;
};

function pathEncoder (v) {
  return '/'+encodeURIComponent(v).replace(/~/g,'%7E');
}
/**
 * Accept an Array of property names and return a JSON Pointer URI fragment
 * @param Array a
 * @return {String}
 */
exports.encodePath = function encodePointer(a){
	// ~ must be encoded explicitly because hacks
	// the slash is encoded by encodeURIComponent
	return a.map(pathEncoder).join('');
};

},{"url":10}],3:[function(require,module,exports){
'use strict';

var Validator = module.exports.Validator = require('./validator');

module.exports.ValidatorResult = require('./helpers').ValidatorResult;
module.exports.ValidationError = require('./helpers').ValidationError;
module.exports.SchemaError = require('./helpers').SchemaError;

module.exports.validate = function (instance, schema, options) {
  var v = new Validator();
  return v.validate(instance, schema, options);
};

},{"./helpers":2,"./validator":4}],4:[function(require,module,exports){
'use strict';

var urilib = require('url');

var attribute = require('./attribute');
var helpers = require('./helpers');
var ValidatorResult = helpers.ValidatorResult;
var SchemaError = helpers.SchemaError;
var SchemaContext = helpers.SchemaContext;

/**
 * Creates a new Validator object
 * @name Validator
 * @constructor
 */
var Validator = function Validator () {
  // Allow a validator instance to override global custom formats or to have their
  // own custom formats.
  this.customFormats = Object.create(Validator.prototype.customFormats);
  this.schemas = {};
  this.unresolvedRefs = [];

  // Use Object.create to make this extensible without Validator instances stepping on each other's toes.
  this.types = Object.create(types);
  this.attributes = Object.create(attribute.validators);
};

// Allow formats to be registered globally.
Validator.prototype.customFormats = {};

// Hint at the presence of a property
Validator.prototype.schemas = null;
Validator.prototype.types = null;
Validator.prototype.attributes = null;
Validator.prototype.unresolvedRefs = null;

/**
 * Adds a schema with a certain urn to the Validator instance.
 * @param schema
 * @param urn
 * @return {Object}
 */
Validator.prototype.addSchema = function addSchema (schema, uri) {
  if (!schema) {
    return null;
  }
  var ourUri = uri || schema.id;
  this.addSubSchema(ourUri, schema);
  if (ourUri) {
    this.schemas[ourUri] = schema;
  }
  return this.schemas[ourUri];
};

Validator.prototype.addSubSchema = function addSubSchema(baseuri, schema) {
  if(!schema || typeof schema!='object') return;
  // Mark all referenced schemas so we can tell later which schemas are referred to, but never defined
  if(schema.$ref){
    var resolvedUri = urilib.resolve(baseuri, schema.$ref);
    // Only mark unknown schemas as unresolved
    if (this.schemas[resolvedUri] === undefined) {
      this.schemas[resolvedUri] = null;
      this.unresolvedRefs.push(resolvedUri);
    }
    return;
  }
  var ourUri = schema.id && urilib.resolve(baseuri, schema.id);
  var ourBase = ourUri || baseuri;
  if (ourUri) {
    if(this.schemas[ourUri]){
      if(!helpers.deepCompareStrict(this.schemas[ourUri], schema)){
        throw new Error('Schema <'+schema+'> already exists with different definition');
      }
      return this.schemas[ourUri];
    }
    this.schemas[ourUri] = schema;
    var documentUri = ourUri.replace(/^([^#]*)#$/, '$1');
    this.schemas[documentUri] = schema;
  }
  this.addSubSchemaArray(ourBase, ((schema.items instanceof Array)?schema.items:[schema.items]));
  this.addSubSchemaArray(ourBase, ((schema.extends instanceof Array)?schema.extends:[schema.extends]));
  this.addSubSchema(ourBase, schema.additionalItems);
  this.addSubSchemaObject(ourBase, schema.properties);
  this.addSubSchema(ourBase, schema.additionalProperties);
  this.addSubSchemaObject(ourBase, schema.definitions);
  this.addSubSchemaObject(ourBase, schema.patternProperties);
  this.addSubSchemaObject(ourBase, schema.dependencies);
  this.addSubSchemaArray(ourBase, schema.disallow);
  this.addSubSchemaArray(ourBase, schema.allOf);
  this.addSubSchemaArray(ourBase, schema.anyOf);
  this.addSubSchemaArray(ourBase, schema.oneOf);
  this.addSubSchema(ourBase, schema.not);
  return this.schemas[ourUri];
};

Validator.prototype.addSubSchemaArray = function addSubSchemaArray(baseuri, schemas) {
  if(!(schemas instanceof Array)) return;
  for(var i=0; i<schemas.length; i++){
    this.addSubSchema(baseuri, schemas[i]);
  }
};

Validator.prototype.addSubSchemaObject = function addSubSchemaArray(baseuri, schemas) {
  if(!schemas || typeof schemas!='object') return;
  for(var p in schemas){
    this.addSubSchema(baseuri, schemas[p]);
  }
};



/**
 * Sets all the schemas of the Validator instance.
 * @param schemas
 */
Validator.prototype.setSchemas = function setSchemas (schemas) {
  this.schemas = schemas;
};

/**
 * Returns the schema of a certain urn
 * @param urn
 */
Validator.prototype.getSchema = function getSchema (urn) {
  return this.schemas[urn];
};

/**
 * Validates instance against the provided schema
 * @param instance
 * @param schema
 * @param [options]
 * @param [ctx]
 * @return {Array}
 */
Validator.prototype.validate = function validate (instance, schema, options, ctx) {
  if (!options) {
    options = {};
  }
  var propertyName = options.propertyName || 'instance';
  // This will work so long as the function at uri.resolve() will resolve a relative URI to a relative URI
  var base = urilib.resolve(options.base||'/', schema.id||'');
  if(!ctx){
    ctx = new SchemaContext(schema, options, propertyName, base, Object.create(this.schemas));
    if (!ctx.schemas[base]) {
      ctx.schemas[base] = schema;
    }
  }
  if (schema) {
    var result = this.validateSchema(instance, schema, options, ctx);
    if (!result) {
      throw new Error('Result undefined');
    }
    return result;
  }
  throw new SchemaError('no schema specified', schema);
};

/**
* @param Object schema
* @return mixed schema uri or false
*/
function shouldResolve(schema) {
  var ref = (typeof schema === 'string') ? schema : schema.$ref;
  if (typeof ref=='string') return ref;
  return false;
}

/**
 * Validates an instance against the schema (the actual work horse)
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @private
 * @return {ValidatorResult}
 */
Validator.prototype.validateSchema = function validateSchema (instance, schema, options, ctx) {
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!schema) {
    throw new Error("schema is undefined");
  }

  if (schema['extends']) {
    if (schema['extends'] instanceof Array) {
      var schemaobj = {schema: schema, ctx: ctx};
      schema['extends'].forEach(this.schemaTraverser.bind(this, schemaobj));
      schema = schemaobj.schema;
      schemaobj.schema = null;
      schemaobj.ctx = null;
      schemaobj = null;
    } else {
      schema = helpers.deepMerge(schema, this.superResolve(schema['extends'], ctx));
    }
  }

  var switchSchema;
  if (switchSchema = shouldResolve(schema)) {
    var resolved = this.resolve(schema, switchSchema, ctx);
    var subctx = new SchemaContext(resolved.subschema, options, ctx.propertyPath, resolved.switchSchema, ctx.schemas);
    return this.validateSchema(instance, resolved.subschema, options, subctx);
  }

  var skipAttributes = options && options.skipAttributes || [];
  // Validate each schema attribute against the instance
  for (var key in schema) {
    if (!attribute.ignoreProperties[key] && skipAttributes.indexOf(key) < 0) {
      var validatorErr = null;
      var validator = this.attributes[key];
      if (validator) {
        validatorErr = validator.call(this, instance, schema, options, ctx);
      } else if (options.allowUnknownAttributes === false) {
        // This represents an error with the schema itself, not an invalid instance
        throw new SchemaError("Unsupported attribute: " + key, schema);
      }
      if (validatorErr) {
        result.importErrors(validatorErr);
      }
    }
  }

  if (typeof options.rewrite == 'function') {
    var value = options.rewrite.call(this, instance, schema, options, ctx);
    result.instance = value;
  }
  return result;
};

/**
* @private
* @param Object schema
* @param SchemaContext ctx
* @returns Object schema or resolved schema
*/
Validator.prototype.schemaTraverser = function schemaTraverser (schemaobj, s) {
  schemaobj.schema = helpers.deepMerge(schemaobj.schema, this.superResolve(s, schemaobj.ctx));
}

/**
* @private
* @param Object schema
* @param SchemaContext ctx
* @returns Object schema or resolved schema
*/
Validator.prototype.superResolve = function superResolve (schema, ctx) {
  var ref;
  if(ref = shouldResolve(schema)) {
    return this.resolve(schema, ref, ctx).subschema;
  }
  return schema;
}

/**
* @private
* @param Object schema
* @param Object switchSchema
* @param SchemaContext ctx
* @return Object resolved schemas {subschema:String, switchSchema: String}
* @thorws SchemaError
*/
Validator.prototype.resolve = function resolve (schema, switchSchema, ctx) {
  switchSchema = ctx.resolve(switchSchema);
  // First see if the schema exists under the provided URI
  if (ctx.schemas[switchSchema]) {
    return {subschema: ctx.schemas[switchSchema], switchSchema: switchSchema};
  }
  // Else try walking the property pointer
  var parsed = urilib.parse(switchSchema);
  var fragment = parsed && parsed.hash;
  var document = fragment && fragment.length && switchSchema.substr(0, switchSchema.length - fragment.length);
  if (!document || !ctx.schemas[document]) {
    throw new SchemaError("no such schema <" + switchSchema + ">", schema);
  }
  var subschema = helpers.objectGetPath(ctx.schemas[document], fragment.substr(1));
  if(subschema===undefined){
    throw new SchemaError("no such schema " + fragment + " located in <" + document + ">", schema);
  }
  return {subschema: subschema, switchSchema: switchSchema};
};

/**
 * Tests whether the instance if of a certain type.
 * @private
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @param type
 * @return {boolean}
 */
Validator.prototype.testType = function validateType (instance, schema, options, ctx, type) {
  if (typeof this.types[type] == 'function') {
    return this.types[type].call(this, instance);
  }
  if (type && typeof type == 'object') {
    var res = this.validateSchema(instance, type, options, ctx);
    return res === undefined || !(res && res.errors.length);
  }
  // Undefined or properties not on the list are acceptable, same as not being defined
  return true;
};

var types = Validator.prototype.types = {};
types.string = function testString (instance) {
  return typeof instance == 'string';
};
types.number = function testNumber (instance) {
  // isFinite returns false for NaN, Infinity, and -Infinity
  return typeof instance == 'number' && isFinite(instance);
};
types.integer = function testInteger (instance) {
  return (typeof instance == 'number') && instance % 1 === 0;
};
types.boolean = function testBoolean (instance) {
  return typeof instance == 'boolean';
};
types.array = function testArray (instance) {
  return instance instanceof Array;
};
types['null'] = function testNull (instance) {
  return instance === null;
};
types.date = function testDate (instance) {
  return instance instanceof Date;
};
types.any = function testAny (instance) {
  return true;
};
types.object = function testObject (instance) {
  // TODO: fix this - see #15
  return instance && (typeof instance) === 'object' && !(instance instanceof Array) && !(instance instanceof Date);
};

module.exports = Validator;

},{"./attribute":1,"./helpers":2,"url":10}],5:[function(require,module,exports){
/*
 A JavaScript implementation of the SHA family of hashes, as
 defined in FIPS PUB 180-4 and FIPS PUB 202, as well as the corresponding
 HMAC implementation as defined in FIPS PUB 198a

 Copyright Brian Turek 2008-2016
 Distributed under the BSD License
 See http://caligatio.github.com/jsSHA/ for more information

 Several functions taken from Paul Johnston
*/
'use strict';(function(X){function C(f,b,c){var d=0,a=[],k=0,g,e,n,h,m,r,t,q,v=!1,u=[],w=[],x,y=!1,z=!1;c=c||{};g=c.encoding||"UTF8";x=c.numRounds||1;n=J(b,g);if(x!==parseInt(x,10)||1>x)throw Error("numRounds must a integer >= 1");if("SHA-1"===f)m=512,r=K,t=Y,h=160,q=function(b){return b.slice()};else if(0===f.lastIndexOf("SHA-",0))if(r=function(b,d){return L(b,d,f)},t=function(b,d,c,a){var l,k;if("SHA-224"===f||"SHA-256"===f)l=(d+65>>>9<<4)+15,k=16;else if("SHA-384"===f||"SHA-512"===f)l=(d+129>>>
10<<5)+31,k=32;else throw Error("Unexpected error in SHA-2 implementation");for(;b.length<=l;)b.push(0);b[d>>>5]|=128<<24-d%32;d=d+c;b[l]=d&4294967295;b[l-1]=d/4294967296|0;c=b.length;for(d=0;d<c;d+=k)a=L(b.slice(d,d+k),a,f);if("SHA-224"===f)b=[a[0],a[1],a[2],a[3],a[4],a[5],a[6]];else if("SHA-256"===f)b=a;else if("SHA-384"===f)b=[a[0].a,a[0].b,a[1].a,a[1].b,a[2].a,a[2].b,a[3].a,a[3].b,a[4].a,a[4].b,a[5].a,a[5].b];else if("SHA-512"===f)b=[a[0].a,a[0].b,a[1].a,a[1].b,a[2].a,a[2].b,a[3].a,a[3].b,a[4].a,
a[4].b,a[5].a,a[5].b,a[6].a,a[6].b,a[7].a,a[7].b];else throw Error("Unexpected error in SHA-2 implementation");return b},q=function(b){return b.slice()},"SHA-224"===f)m=512,h=224;else if("SHA-256"===f)m=512,h=256;else if("SHA-384"===f)m=1024,h=384;else if("SHA-512"===f)m=1024,h=512;else throw Error("Chosen SHA variant is not supported");else if(0===f.lastIndexOf("SHA3-",0)||0===f.lastIndexOf("SHAKE",0)){var F=6;r=D;q=function(b){var f=[],a;for(a=0;5>a;a+=1)f[a]=b[a].slice();return f};if("SHA3-224"===
f)m=1152,h=224;else if("SHA3-256"===f)m=1088,h=256;else if("SHA3-384"===f)m=832,h=384;else if("SHA3-512"===f)m=576,h=512;else if("SHAKE128"===f)m=1344,h=-1,F=31,z=!0;else if("SHAKE256"===f)m=1088,h=-1,F=31,z=!0;else throw Error("Chosen SHA variant is not supported");t=function(b,f,a,d,c){a=m;var l=F,k,g=[],e=a>>>5,h=0,p=f>>>5;for(k=0;k<p&&f>=a;k+=e)d=D(b.slice(k,k+e),d),f-=a;b=b.slice(k);for(f%=a;b.length<e;)b.push(0);k=f>>>3;b[k>>2]^=l<<24-k%4*8;b[e-1]^=128;for(d=D(b,d);32*g.length<c;){b=d[h%5][h/
5|0];g.push((b.b&255)<<24|(b.b&65280)<<8|(b.b&16711680)>>8|b.b>>>24);if(32*g.length>=c)break;g.push((b.a&255)<<24|(b.a&65280)<<8|(b.a&16711680)>>8|b.a>>>24);h+=1;0===64*h%a&&D(null,d)}return g}}else throw Error("Chosen SHA variant is not supported");e=B(f);this.setHMACKey=function(b,a,c){var l;if(!0===v)throw Error("HMAC key already set");if(!0===y)throw Error("Cannot set HMAC key after calling update");if(!0===z)throw Error("SHAKE is not supported for HMAC");g=(c||{}).encoding||"UTF8";a=J(a,g)(b);
b=a.binLen;a=a.value;l=m>>>3;c=l/4-1;if(l<b/8){for(a=t(a,b,0,B(f),h);a.length<=c;)a.push(0);a[c]&=4294967040}else if(l>b/8){for(;a.length<=c;)a.push(0);a[c]&=4294967040}for(b=0;b<=c;b+=1)u[b]=a[b]^909522486,w[b]=a[b]^1549556828;e=r(u,e);d=m;v=!0};this.update=function(b){var f,c,g,h=0,q=m>>>5;f=n(b,a,k);b=f.binLen;c=f.value;f=b>>>5;for(g=0;g<f;g+=q)h+m<=b&&(e=r(c.slice(g,g+q),e),h+=m);d+=h;a=c.slice(h>>>5);k=b%m;y=!0};this.getHash=function(b,c){var g,m,n,r;if(!0===v)throw Error("Cannot call getHash after setting HMAC key");
n=M(c);if(!0===z){if(-1===n.shakeLen)throw Error("shakeLen must be specified in options");h=n.shakeLen}switch(b){case "HEX":g=function(b){return N(b,h,n)};break;case "B64":g=function(b){return O(b,h,n)};break;case "BYTES":g=function(b){return P(b,h)};break;case "ARRAYBUFFER":try{m=new ArrayBuffer(0)}catch(sa){throw Error("ARRAYBUFFER not supported by this environment");}g=function(b){return Q(b,h)};break;default:throw Error("format must be HEX, B64, BYTES, or ARRAYBUFFER");}r=t(a.slice(),k,d,q(e),
h);for(m=1;m<x;m+=1)!0===z&&0!==h%32&&(r[r.length-1]&=4294967040<<24-h%32),r=t(r,h,0,B(f),h);return g(r)};this.getHMAC=function(b,c){var g,n,u,x;if(!1===v)throw Error("Cannot call getHMAC without first setting HMAC key");u=M(c);switch(b){case "HEX":g=function(b){return N(b,h,u)};break;case "B64":g=function(b){return O(b,h,u)};break;case "BYTES":g=function(b){return P(b,h)};break;case "ARRAYBUFFER":try{g=new ArrayBuffer(0)}catch(z){throw Error("ARRAYBUFFER not supported by this environment");}g=function(b){return Q(b,
h)};break;default:throw Error("outputFormat must be HEX, B64, BYTES, or ARRAYBUFFER");}n=t(a.slice(),k,d,q(e),h);x=r(w,B(f));x=t(n,h,m,x,h);return g(x)}}function a(f,b){this.a=f;this.b=b}function Z(f,b,a){var d=f.length,l,k,g,e,n;b=b||[0];a=a||0;n=a>>>3;if(0!==d%2)throw Error("String of HEX type must be in byte increments");for(l=0;l<d;l+=2){k=parseInt(f.substr(l,2),16);if(isNaN(k))throw Error("String of HEX type contains invalid characters");e=(l>>>1)+n;for(g=e>>>2;b.length<=g;)b.push(0);b[g]|=k<<
8*(3-e%4)}return{value:b,binLen:4*d+a}}function aa(f,b,a){var d=[],l,k,g,e,d=b||[0];a=a||0;k=a>>>3;for(l=0;l<f.length;l+=1)b=f.charCodeAt(l),e=l+k,g=e>>>2,d.length<=g&&d.push(0),d[g]|=b<<8*(3-e%4);return{value:d,binLen:8*f.length+a}}function ba(f,b,a){var d=[],l=0,k,g,e,n,h,m,d=b||[0];a=a||0;b=a>>>3;if(-1===f.search(/^[a-zA-Z0-9=+\/]+$/))throw Error("Invalid character in base-64 string");g=f.indexOf("=");f=f.replace(/\=/g,"");if(-1!==g&&g<f.length)throw Error("Invalid '=' found in base-64 string");
for(g=0;g<f.length;g+=4){h=f.substr(g,4);for(e=n=0;e<h.length;e+=1)k="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(h[e]),n|=k<<18-6*e;for(e=0;e<h.length-1;e+=1){m=l+b;for(k=m>>>2;d.length<=k;)d.push(0);d[k]|=(n>>>16-8*e&255)<<8*(3-m%4);l+=1}}return{value:d,binLen:8*l+a}}function ca(a,b,c){var d=[],l,k,g,d=b||[0];c=c||0;l=c>>>3;for(b=0;b<a.byteLength;b+=1)g=b+l,k=g>>>2,d.length<=k&&d.push(0),d[k]|=a[b]<<8*(3-g%4);return{value:d,binLen:8*a.byteLength+c}}function N(a,b,c){var d=
"";b/=8;var l,k;for(l=0;l<b;l+=1)k=a[l>>>2]>>>8*(3-l%4),d+="0123456789abcdef".charAt(k>>>4&15)+"0123456789abcdef".charAt(k&15);return c.outputUpper?d.toUpperCase():d}function O(a,b,c){var d="",l=b/8,k,g,e;for(k=0;k<l;k+=3)for(g=k+1<l?a[k+1>>>2]:0,e=k+2<l?a[k+2>>>2]:0,e=(a[k>>>2]>>>8*(3-k%4)&255)<<16|(g>>>8*(3-(k+1)%4)&255)<<8|e>>>8*(3-(k+2)%4)&255,g=0;4>g;g+=1)8*k+6*g<=b?d+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(e>>>6*(3-g)&63):d+=c.b64Pad;return d}function P(a,
b){var c="",d=b/8,l,k;for(l=0;l<d;l+=1)k=a[l>>>2]>>>8*(3-l%4)&255,c+=String.fromCharCode(k);return c}function Q(a,b){var c=b/8,d,l=new ArrayBuffer(c);for(d=0;d<c;d+=1)l[d]=a[d>>>2]>>>8*(3-d%4)&255;return l}function M(a){var b={outputUpper:!1,b64Pad:"=",shakeLen:-1};a=a||{};b.outputUpper=a.outputUpper||!1;!0===a.hasOwnProperty("b64Pad")&&(b.b64Pad=a.b64Pad);if(!0===a.hasOwnProperty("shakeLen")){if(0!==a.shakeLen%8)throw Error("shakeLen must be a multiple of 8");b.shakeLen=a.shakeLen}if("boolean"!==
typeof b.outputUpper)throw Error("Invalid outputUpper formatting option");if("string"!==typeof b.b64Pad)throw Error("Invalid b64Pad formatting option");return b}function J(a,b){var c;switch(b){case "UTF8":case "UTF16BE":case "UTF16LE":break;default:throw Error("encoding must be UTF8, UTF16BE, or UTF16LE");}switch(a){case "HEX":c=Z;break;case "TEXT":c=function(a,f,c){var e=[],p=[],n=0,h,m,r,t,q,e=f||[0];f=c||0;r=f>>>3;if("UTF8"===b)for(h=0;h<a.length;h+=1)for(c=a.charCodeAt(h),p=[],128>c?p.push(c):
2048>c?(p.push(192|c>>>6),p.push(128|c&63)):55296>c||57344<=c?p.push(224|c>>>12,128|c>>>6&63,128|c&63):(h+=1,c=65536+((c&1023)<<10|a.charCodeAt(h)&1023),p.push(240|c>>>18,128|c>>>12&63,128|c>>>6&63,128|c&63)),m=0;m<p.length;m+=1){q=n+r;for(t=q>>>2;e.length<=t;)e.push(0);e[t]|=p[m]<<8*(3-q%4);n+=1}else if("UTF16BE"===b||"UTF16LE"===b)for(h=0;h<a.length;h+=1){c=a.charCodeAt(h);"UTF16LE"===b&&(m=c&255,c=m<<8|c>>>8);q=n+r;for(t=q>>>2;e.length<=t;)e.push(0);e[t]|=c<<8*(2-q%4);n+=2}return{value:e,binLen:8*
n+f}};break;case "B64":c=ba;break;case "BYTES":c=aa;break;case "ARRAYBUFFER":try{c=new ArrayBuffer(0)}catch(d){throw Error("ARRAYBUFFER not supported by this environment");}c=ca;break;default:throw Error("format must be HEX, TEXT, B64, BYTES, or ARRAYBUFFER");}return c}function y(a,b){return a<<b|a>>>32-b}function R(f,b){return 32<b?(b=b-32,new a(f.b<<b|f.a>>>32-b,f.a<<b|f.b>>>32-b)):0!==b?new a(f.a<<b|f.b>>>32-b,f.b<<b|f.a>>>32-b):f}function v(a,b){return a>>>b|a<<32-b}function w(f,b){var c=null,
c=new a(f.a,f.b);return c=32>=b?new a(c.a>>>b|c.b<<32-b&4294967295,c.b>>>b|c.a<<32-b&4294967295):new a(c.b>>>b-32|c.a<<64-b&4294967295,c.a>>>b-32|c.b<<64-b&4294967295)}function S(f,b){var c=null;return c=32>=b?new a(f.a>>>b,f.b>>>b|f.a<<32-b&4294967295):new a(0,f.a>>>b-32)}function da(a,b,c){return a&b^~a&c}function ea(f,b,c){return new a(f.a&b.a^~f.a&c.a,f.b&b.b^~f.b&c.b)}function T(a,b,c){return a&b^a&c^b&c}function fa(f,b,c){return new a(f.a&b.a^f.a&c.a^b.a&c.a,f.b&b.b^f.b&c.b^b.b&c.b)}function ga(a){return v(a,
2)^v(a,13)^v(a,22)}function ha(f){var b=w(f,28),c=w(f,34);f=w(f,39);return new a(b.a^c.a^f.a,b.b^c.b^f.b)}function ia(a){return v(a,6)^v(a,11)^v(a,25)}function ja(f){var b=w(f,14),c=w(f,18);f=w(f,41);return new a(b.a^c.a^f.a,b.b^c.b^f.b)}function ka(a){return v(a,7)^v(a,18)^a>>>3}function la(f){var b=w(f,1),c=w(f,8);f=S(f,7);return new a(b.a^c.a^f.a,b.b^c.b^f.b)}function ma(a){return v(a,17)^v(a,19)^a>>>10}function na(f){var b=w(f,19),c=w(f,61);f=S(f,6);return new a(b.a^c.a^f.a,b.b^c.b^f.b)}function G(a,
b){var c=(a&65535)+(b&65535);return((a>>>16)+(b>>>16)+(c>>>16)&65535)<<16|c&65535}function oa(a,b,c,d){var l=(a&65535)+(b&65535)+(c&65535)+(d&65535);return((a>>>16)+(b>>>16)+(c>>>16)+(d>>>16)+(l>>>16)&65535)<<16|l&65535}function H(a,b,c,d,l){var e=(a&65535)+(b&65535)+(c&65535)+(d&65535)+(l&65535);return((a>>>16)+(b>>>16)+(c>>>16)+(d>>>16)+(l>>>16)+(e>>>16)&65535)<<16|e&65535}function pa(f,b){var c,d,l;c=(f.b&65535)+(b.b&65535);d=(f.b>>>16)+(b.b>>>16)+(c>>>16);l=(d&65535)<<16|c&65535;c=(f.a&65535)+
(b.a&65535)+(d>>>16);d=(f.a>>>16)+(b.a>>>16)+(c>>>16);return new a((d&65535)<<16|c&65535,l)}function qa(f,b,c,d){var l,e,g;l=(f.b&65535)+(b.b&65535)+(c.b&65535)+(d.b&65535);e=(f.b>>>16)+(b.b>>>16)+(c.b>>>16)+(d.b>>>16)+(l>>>16);g=(e&65535)<<16|l&65535;l=(f.a&65535)+(b.a&65535)+(c.a&65535)+(d.a&65535)+(e>>>16);e=(f.a>>>16)+(b.a>>>16)+(c.a>>>16)+(d.a>>>16)+(l>>>16);return new a((e&65535)<<16|l&65535,g)}function ra(f,b,c,d,l){var e,g,p;e=(f.b&65535)+(b.b&65535)+(c.b&65535)+(d.b&65535)+(l.b&65535);g=
(f.b>>>16)+(b.b>>>16)+(c.b>>>16)+(d.b>>>16)+(l.b>>>16)+(e>>>16);p=(g&65535)<<16|e&65535;e=(f.a&65535)+(b.a&65535)+(c.a&65535)+(d.a&65535)+(l.a&65535)+(g>>>16);g=(f.a>>>16)+(b.a>>>16)+(c.a>>>16)+(d.a>>>16)+(l.a>>>16)+(e>>>16);return new a((g&65535)<<16|e&65535,p)}function A(f){var b=0,c=0,d;for(d=0;d<arguments.length;d+=1)b^=arguments[d].b,c^=arguments[d].a;return new a(c,b)}function B(f){var b=[],c;if("SHA-1"===f)b=[1732584193,4023233417,2562383102,271733878,3285377520];else if(0===f.lastIndexOf("SHA-",
0))switch(b=[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428],c=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],f){case "SHA-224":break;case "SHA-256":b=c;break;case "SHA-384":b=[new a(3418070365,b[0]),new a(1654270250,b[1]),new a(2438529370,b[2]),new a(355462360,b[3]),new a(1731405415,b[4]),new a(41048885895,b[5]),new a(3675008525,b[6]),new a(1203062813,b[7])];break;case "SHA-512":b=[new a(c[0],4089235720),new a(c[1],
2227873595),new a(c[2],4271175723),new a(c[3],1595750129),new a(c[4],2917565137),new a(c[5],725511199),new a(c[6],4215389547),new a(c[7],327033209)];break;default:throw Error("Unknown SHA variant");}else if(0===f.lastIndexOf("SHA3-",0)||0===f.lastIndexOf("SHAKE",0))for(f=0;5>f;f+=1)b[f]=[new a(0,0),new a(0,0),new a(0,0),new a(0,0),new a(0,0)];else throw Error("No SHA variants supported");return b}function K(a,b){var c=[],d,e,k,g,p,n,h;d=b[0];e=b[1];k=b[2];g=b[3];p=b[4];for(h=0;80>h;h+=1)c[h]=16>h?
a[h]:y(c[h-3]^c[h-8]^c[h-14]^c[h-16],1),n=20>h?H(y(d,5),e&k^~e&g,p,1518500249,c[h]):40>h?H(y(d,5),e^k^g,p,1859775393,c[h]):60>h?H(y(d,5),T(e,k,g),p,2400959708,c[h]):H(y(d,5),e^k^g,p,3395469782,c[h]),p=g,g=k,k=y(e,30),e=d,d=n;b[0]=G(d,b[0]);b[1]=G(e,b[1]);b[2]=G(k,b[2]);b[3]=G(g,b[3]);b[4]=G(p,b[4]);return b}function Y(a,b,c,d){var e;for(e=(b+65>>>9<<4)+15;a.length<=e;)a.push(0);a[b>>>5]|=128<<24-b%32;b+=c;a[e]=b&4294967295;a[e-1]=b/4294967296|0;b=a.length;for(e=0;e<b;e+=16)d=K(a.slice(e,e+16),d);
return d}function L(f,b,c){var d,l,k,g,p,n,h,m,r,t,q,v,u,w,x,y,z,F,A,B,C,D,E=[],I;if("SHA-224"===c||"SHA-256"===c)t=64,v=1,D=Number,u=G,w=oa,x=H,y=ka,z=ma,F=ga,A=ia,C=T,B=da,I=e;else if("SHA-384"===c||"SHA-512"===c)t=80,v=2,D=a,u=pa,w=qa,x=ra,y=la,z=na,F=ha,A=ja,C=fa,B=ea,I=U;else throw Error("Unexpected error in SHA-2 implementation");c=b[0];d=b[1];l=b[2];k=b[3];g=b[4];p=b[5];n=b[6];h=b[7];for(q=0;q<t;q+=1)16>q?(r=q*v,m=f.length<=r?0:f[r],r=f.length<=r+1?0:f[r+1],E[q]=new D(m,r)):E[q]=w(z(E[q-2]),
E[q-7],y(E[q-15]),E[q-16]),m=x(h,A(g),B(g,p,n),I[q],E[q]),r=u(F(c),C(c,d,l)),h=n,n=p,p=g,g=u(k,m),k=l,l=d,d=c,c=u(m,r);b[0]=u(c,b[0]);b[1]=u(d,b[1]);b[2]=u(l,b[2]);b[3]=u(k,b[3]);b[4]=u(g,b[4]);b[5]=u(p,b[5]);b[6]=u(n,b[6]);b[7]=u(h,b[7]);return b}function D(f,b){var c,d,e,k,g=[],p=[];if(null!==f)for(d=0;d<f.length;d+=2)b[(d>>>1)%5][(d>>>1)/5|0]=A(b[(d>>>1)%5][(d>>>1)/5|0],new a((f[d+1]&255)<<24|(f[d+1]&65280)<<8|(f[d+1]&16711680)>>>8|f[d+1]>>>24,(f[d]&255)<<24|(f[d]&65280)<<8|(f[d]&16711680)>>>8|
f[d]>>>24));for(c=0;24>c;c+=1){k=B("SHA3-");for(d=0;5>d;d+=1)g[d]=A(b[d][0],b[d][1],b[d][2],b[d][3],b[d][4]);for(d=0;5>d;d+=1)p[d]=A(g[(d+4)%5],R(g[(d+1)%5],1));for(d=0;5>d;d+=1)for(e=0;5>e;e+=1)b[d][e]=A(b[d][e],p[d]);for(d=0;5>d;d+=1)for(e=0;5>e;e+=1)k[e][(2*d+3*e)%5]=R(b[d][e],V[d][e]);for(d=0;5>d;d+=1)for(e=0;5>e;e+=1)b[d][e]=A(k[d][e],new a(~k[(d+1)%5][e].a&k[(d+2)%5][e].a,~k[(d+1)%5][e].b&k[(d+2)%5][e].b));b[0][0]=A(b[0][0],W[c])}return b}var e,U,V,W;e=[1116352408,1899447441,3049323471,3921009573,
961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,
883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];U=[new a(e[0],3609767458),new a(e[1],602891725),new a(e[2],3964484399),new a(e[3],2173295548),new a(e[4],4081628472),new a(e[5],3053834265),new a(e[6],2937671579),new a(e[7],3664609560),new a(e[8],2734883394),new a(e[9],1164996542),new a(e[10],1323610764),new a(e[11],3590304994),new a(e[12],4068182383),new a(e[13],991336113),new a(e[14],633803317),new a(e[15],
3479774868),new a(e[16],2666613458),new a(e[17],944711139),new a(e[18],2341262773),new a(e[19],2007800933),new a(e[20],1495990901),new a(e[21],1856431235),new a(e[22],3175218132),new a(e[23],2198950837),new a(e[24],3999719339),new a(e[25],766784016),new a(e[26],2566594879),new a(e[27],3203337956),new a(e[28],1034457026),new a(e[29],2466948901),new a(e[30],3758326383),new a(e[31],168717936),new a(e[32],1188179964),new a(e[33],1546045734),new a(e[34],1522805485),new a(e[35],2643833823),new a(e[36],
2343527390),new a(e[37],1014477480),new a(e[38],1206759142),new a(e[39],344077627),new a(e[40],1290863460),new a(e[41],3158454273),new a(e[42],3505952657),new a(e[43],106217008),new a(e[44],3606008344),new a(e[45],1432725776),new a(e[46],1467031594),new a(e[47],851169720),new a(e[48],3100823752),new a(e[49],1363258195),new a(e[50],3750685593),new a(e[51],3785050280),new a(e[52],3318307427),new a(e[53],3812723403),new a(e[54],2003034995),new a(e[55],3602036899),new a(e[56],1575990012),new a(e[57],
1125592928),new a(e[58],2716904306),new a(e[59],442776044),new a(e[60],593698344),new a(e[61],3733110249),new a(e[62],2999351573),new a(e[63],3815920427),new a(3391569614,3928383900),new a(3515267271,566280711),new a(3940187606,3454069534),new a(4118630271,4000239992),new a(116418474,1914138554),new a(174292421,2731055270),new a(289380356,3203993006),new a(460393269,320620315),new a(685471733,587496836),new a(852142971,1086792851),new a(1017036298,365543100),new a(1126000580,2618297676),new a(1288033470,
3409855158),new a(1501505948,4234509866),new a(1607167915,987167468),new a(1816402316,1246189591)];W=[new a(0,1),new a(0,32898),new a(2147483648,32906),new a(2147483648,2147516416),new a(0,32907),new a(0,2147483649),new a(2147483648,2147516545),new a(2147483648,32777),new a(0,138),new a(0,136),new a(0,2147516425),new a(0,2147483658),new a(0,2147516555),new a(2147483648,139),new a(2147483648,32905),new a(2147483648,32771),new a(2147483648,32770),new a(2147483648,128),new a(0,32778),new a(2147483648,
2147483658),new a(2147483648,2147516545),new a(2147483648,32896),new a(0,2147483649),new a(2147483648,2147516424)];V=[[0,36,3,41,18],[1,44,10,45,2],[62,6,43,15,61],[28,55,25,21,56],[27,20,39,8,14]];"function"===typeof define&&define.amd?define(function(){return C}):"undefined"!==typeof exports?("undefined"!==typeof module&&module.exports&&(module.exports=C),exports=C):X.jsSHA=C})(this);

},{}],6:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],8:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],9:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":7,"./encode":8}],10:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = this.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      this.hostname = newOut.join('.');
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  Object.keys(this).forEach(function(k) {
    result[k] = this[k];
  }, this);

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    Object.keys(relative).forEach(function(k) {
      if (k !== 'protocol')
        result[k] = relative[k];
    });

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      Object.keys(relative).forEach(function(k) {
        result[k] = relative[k];
      });
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

function isString(arg) {
  return typeof arg === "string";
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return  arg == null;
}

},{"punycode":6,"querystring":9}],11:[function(require,module,exports){
module.exports={
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "http://mycs.com/schemas/furniture/couchtable",
  "definitions": {
    "sku": {
      "type": "string",
      "description": "unique id of a component in our furniture component store",
      "pattern": "^(\\d+\\.)+[\\d]+$"
    },
    "label_id": {
      "type": "string",
      "description": "element's label id"
    },
    "invisible": {
      "type": "boolean",
      "description": "determines whether element must be rendered or not"
    },
    "element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "label_id": { "$ref": "#/definitions/label_id" },
        "invisible": { "$ref": "#/definitions/invisible" }
      }
    }
  },
  "type": "array",
  "minItems": 1,
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": [ "clegs", "ctop"],
    "properties": {
      "clegs": {
        "type": "object",
        "additionalProperties": false,
        "required": [ "back", "front_left", "front_right" ],
        "properties": {
          "back": { "$ref": "#/definitions/element" },
          "front_left": { "$ref": "#/definitions/element" },
          "front_right": { "$ref": "#/definitions/element" }
        }
      },
      "ctop": { "$ref": "#/definitions/element" }
    }
  }
}
},{}],12:[function(require,module,exports){
module.exports={
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "http://mycs.com/schemas/furniture/couchtable",
  "definitions": {
    "sku": {
      "type": "string",
      "description": "unique id of a component in our furniture component store",
      "pattern": "^(\\d+\\.)+[\\d]+$"
    },
    "element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" }
      }
    }
  },
  "type": "array",
  "minItems": 1,
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": [ "clegs", "ctop"],
    "properties": {
      "clegs": {
        "type": "object",
        "additionalProperties": false,
        "required": [ "back", "front_left", "front_right" ],
        "properties": {
          "back": { "$ref": "#/definitions/element" },
          "front_left": { "$ref": "#/definitions/element" },
          "front_right": { "$ref": "#/definitions/element" }
        }
      },
      "ctop": { "$ref": "#/definitions/element" }
    }
  }
}
},{}],13:[function(require,module,exports){
module.exports={
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "http://mycs.com/schemas/furniture/shelf",
  "definitions": {
    "sku": {
      "type": "string",
      "description": "unique id of a component in our furniture component store",
      "pattern": "^(\\d+\\.)+[\\d]+$"
    },
    "position": {
      "type": "number",
      "description": "vertical position of the element",
      "pattern": "^-?\\d{1,3}(\\.\\d)*$"
    },
    "h_position": {
      "type": "number",
      "description": "horizontal position of the element",
      "pattern": "^-?\\d{1,3}(\\.\\d)*$"
    },
    "label_id": {
      "type": "string",
      "description": "element's label id"
    },
    "invisible": {
      "type": "boolean",
      "description": "determines whether element must be rendered or not"
    },
    "element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "label_id": { "$ref": "#/definitions/label_id" },
        "invisible": { "$ref": "#/definitions/invisible" }
      }
    },
    "positioned_element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku", "position" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "position": { "$ref": "#/definitions/position" },
        "label_id": { "$ref": "#/definitions/label_id" },
        "invisible": { "$ref": "#/definitions/invisible" }
      }
    },
    "horizontally_positioned_element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku", "position", "h_position" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "position": { "$ref": "#/definitions/position" },
        "h_position": { "$ref": "#/definitions/h_position" },
        "label_id": { "$ref": "#/definitions/label_id" },
        "invisible": { "$ref": "#/definitions/invisible" }
      }
    },
    "handle_type": {
      "type": "string",
      "enum": [ "center", "left", "right" ]
    },
    "handle_element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku", "position", "h_position", "type" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "position": { "$ref": "#/definitions/position" },
        "h_position": { "$ref": "#/definitions/h_position" },
        "type": { "$ref": "#/definitions/handle_type" },
        "label_id": { "$ref": "#/definitions/label_id" },
        "invisible": { "$ref": "#/definitions/invisible" }
      }
    }
  },
  "type": "object",
  "additionalProperties": false,
  "required": [ "columns" ],
  "properties": {
    "columns": {
      "type": "array",
      "uniqueItems": true,
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [ "boards", "fronts", "position", "wallLeft", "wallRight", "backwalls", "handles", "legPlatforms", "legs" ],
        "dependencies": {
          "legPlatforms": [ "legs" ],
          "legs": [ "legPlatforms" ]
        },
        "properties": {
          "position": { "$ref": "#/definitions/position" },
          "wallLeft": {
            "type": "array",
            "uniqueItems": true,
            "items": { "$ref": "#/definitions/element" }
          },
          "wallRight": {
            "type": "array",
            "uniqueItems": true,
            "minItems": 1,
            "items": { "$ref": "#/definitions/element" }
          },
          "backwalls": {
            "type": "array",
            "uniqueItems": true,
            "items": { "$ref": "#/definitions/positioned_element" }
          },
          "boards": {
            "type": "array",
            "uniqueItems": true,
            "minItems": 2,
            "items": { "$ref": "#/definitions/positioned_element" }
          },
          "fronts": {
            "type": "array",
            "uniqueItems": true,
            "items": { "$ref": "#/definitions/horizontally_positioned_element" }
          },
          "handles": {
            "type": "array",
            "uniqueItems": true,
            "items": { "$ref": "#/definitions/handle_element" }
          },
          "legPlatforms": {
            "type": "array",
            "description": "type for shelf's legs",
            "items": { "$ref": "#/definitions/element" }
          },
          "legs": {
            "type": "array",
            "description": "type for shelf's legs",
            "items": { "$ref": "#/definitions/element" }
          }
        }
      }
    }
  }
}
},{}],14:[function(require,module,exports){
module.exports={
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "http://mycs.com/schemas/furniture/shelf",
  "definitions": {
    "sku": {
      "type": "string",
      "description": "unique id of a component in our furniture component store",
      "pattern": "^(\\d+\\.)+[\\d]+$"
    },
    "position": {
      "type": "number",
      "description": "vertical position of the element",
      "pattern": "^-?\\d{1,3}(\\.\\d)*$"
    },
    "h_position": {
      "type": "number",
      "description": "horizontal position of the element",
      "pattern": "^-?\\d{1,3}(\\.\\d)*$"
    },
    "element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" }
      }
    },
    "positioned_element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku", "position" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "position": { "$ref": "#/definitions/position" }
      }
    },
    "horizontally_positioned_element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku", "position", "h_position" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "position": { "$ref": "#/definitions/position" },
        "h_position": { "$ref": "#/definitions/h_position" }
      }
    },
    "handle_type": {
      "type": "string",
      "enum": [ "center", "left", "right" ]
    },
    "handle_element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku", "position", "h_position", "type" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "position": { "$ref": "#/definitions/position" },
        "h_position": { "$ref": "#/definitions/h_position" },
        "type": { "$ref": "#/definitions/handle_type" }
      }
    }
  },
  "type": "object",
  "additionalProperties": false,
  "required": [ "columns" ],
  "properties": {
    "columns": {
      "type": "array",
      "uniqueItems": true,
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [ "boards", "fronts", "position", "wallLeft", "wallRight", "backwalls", "handles", "legPlatforms", "legs" ],
        "dependencies": {
          "legPlatforms": [ "legs" ],
          "legs": [ "legPlatforms" ]
        },
        "properties": {
          "position": { "$ref": "#/definitions/position" },
          "wallLeft": {
            "type": "array",
            "uniqueItems": true,
            "items": { "$ref": "#/definitions/element" }
          },
          "wallRight": {
            "type": "array",
            "uniqueItems": true,
            "minItems": 1,
            "items": { "$ref": "#/definitions/element" }
          },
          "backwalls": {
            "type": "array",
            "uniqueItems": true,
            "items": { "$ref": "#/definitions/positioned_element" }
          },
          "boards": {
            "type": "array",
            "uniqueItems": true,
            "minItems": 2,
            "items": { "$ref": "#/definitions/positioned_element" }
          },
          "fronts": {
            "type": "array",
            "uniqueItems": true,
            "items": { "$ref": "#/definitions/horizontally_positioned_element" }
          },
          "handles": {
            "type": "array",
            "uniqueItems": true,
            "items": { "$ref": "#/definitions/handle_element" }
          },
          "legPlatforms": {
            "type": "array",
            "description": "type for shelf's legs",
            "items": { "$ref": "#/definitions/element" }
          },
          "legs": {
            "type": "array",
            "description": "type for shelf's legs",
            "items": { "$ref": "#/definitions/element" }
          }
        }
      }
    }
  }
}
},{}],15:[function(require,module,exports){
module.exports={
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "http://mycs.com/schemas/furniture/table",
  "definitions": {
    "sku": {
      "type": "string",
      "description": "unique id of a component in our furniture component store",
      "pattern": "^(\\d+\\.)+[\\d]+$"
    },
    "label_id": {
      "type": "string",
      "description": "element's label id"
    },
    "invisible": {
      "type": "boolean",
      "description": "determines whether element must be rendered or not"
    },
    "element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "label_id": { "$ref": "#/definitions/label_id" },
        "invisible": { "$ref": "#/definitions/invisible" }
      }
    },
    "drawer": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "drawer_box", "drawer_front" ],
      "properties": {
        "drawer_box": { "$ref": "#/definitions/element" },
        "drawer_front": { "$ref": "#/definitions/element" }
      }
    },
    "drawers": {
      "type": "object",
      "oneOf": [
        {
          "additionalProperties": false,
          "properties": {}
        },
        {
          "additionalProperties": false,
          "required": [ "single_drawer" ],
          "properties": {
            "single_drawer": { "$ref": "#/definitions/drawer" }
          }
        },
        {
          "additionalProperties": false,
          "required": [ "left_drawer", "right_drawer" ],
          "properties": {
            "left_drawer": { "$ref": "#/definitions/drawer" },
            "right_drawer": { "$ref": "#/definitions/drawer" }
          }
        }
      ]
    }
  },
  "type": "object",
  "required": [ "tops", "legs", "extensions", "frames", "back_drawers", "front_drawers" ],
  "additionalProperties": false,
  "properties": {
    "tops": {
      "type": "object",
      "required": [ "tabletop" ],
      "additionalProperties": false,
      "properties": {
        "tabletop": { "$ref": "#/definitions/element" }
      }
    },
    "legs": {
      "type": "object",
      "oneOf": [
        {
          "additionalProperties": false,
          "required": [ "left", "right" ],
          "properties": {
            "left": { "$ref": "#/definitions/element" },
            "right": { "$ref": "#/definitions/element" }
          }
        },
        {
          "additionalProperties": false,
          "required": [ "back_left", "back_right", "front_left", "front_right" ],
          "properties": {
            "back_left": { "$ref": "#/definitions/element" },
            "back_right": { "$ref": "#/definitions/element" },
            "front_left": { "$ref": "#/definitions/element" },
            "front_right": { "$ref": "#/definitions/element" }
          }
        }
      ]
    },
    "extensions": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "left": { "$ref": "#/definitions/element" },
        "right": { "$ref": "#/definitions/element" }
      }
    },
    "frames": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "left": { "$ref": "#/definitions/element" },
        "right": { "$ref": "#/definitions/element" },
        "back": { "$ref": "#/definitions/element" },
        "front": { "$ref": "#/definitions/element" }
      }
    },
    "back_drawers": { "$ref": "#/definitions/drawers" },
    "front_drawers": { "$ref": "#/definitions/drawers" }
  }
}
},{}],16:[function(require,module,exports){
module.exports={
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "http://mycs.com/schemas/furniture/table",
  "definitions": {
    "sku": {
      "type": "string",
      "description": "unique id of a component in our furniture component store",
      "pattern": "^(\\d+\\.)+[\\d]+$"
    },
    "element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" }
      }
    },
    "drawer": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "drawer_box", "drawer_front" ],
      "properties": {
        "drawer_box": { "$ref": "#/definitions/element" },
        "drawer_front": { "$ref": "#/definitions/element" }
      }
    },
    "drawers": {
      "type": "object",
      "oneOf": [
        {
          "additionalProperties": false,
          "properties": {}
        },
        {
          "additionalProperties": false,
          "required": [ "single_drawer" ],
          "properties": {
            "single_drawer": { "$ref": "#/definitions/drawer" }
          }
        },
        {
          "additionalProperties": false,
          "required": [ "left_drawer", "right_drawer" ],
          "properties": {
            "left_drawer": { "$ref": "#/definitions/drawer" },
            "right_drawer": { "$ref": "#/definitions/drawer" }
          }
        }
      ]
    }
  },
  "type": "object",
  "required": [ "tops", "legs", "extensions", "frames", "back_drawers", "front_drawers" ],
  "additionalProperties": false,
  "properties": {
    "tops": {
      "type": "object",
      "required": [ "tabletop" ],
      "additionalProperties": false,
      "properties": {
        "tabletop": { "$ref": "#/definitions/element" }
      }
    },
    "legs": {
      "type": "object",
      "oneOf": [
        {
          "additionalProperties": false,
          "required": [ "left", "right" ],
          "properties": {
            "left": { "$ref": "#/definitions/element" },
            "right": { "$ref": "#/definitions/element" }
          }
        },
        {
          "additionalProperties": false,
          "required": [ "back_left", "back_right", "front_left", "front_right" ],
          "properties": {
            "back_left": { "$ref": "#/definitions/element" },
            "back_right": { "$ref": "#/definitions/element" },
            "front_left": { "$ref": "#/definitions/element" },
            "front_right": { "$ref": "#/definitions/element" }
          }
        }
      ]
    },
    "extensions": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "left": { "$ref": "#/definitions/element" },
        "right": { "$ref": "#/definitions/element" }
      }
    },
    "frames": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "left": { "$ref": "#/definitions/element" },
        "right": { "$ref": "#/definitions/element" },
        "back": { "$ref": "#/definitions/element" },
        "front": { "$ref": "#/definitions/element" }
      }
    },
    "back_drawers": { "$ref": "#/definitions/drawers" },
    "front_drawers": { "$ref": "#/definitions/drawers" }
  }
}
},{}],17:[function(require,module,exports){
module.exports={
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "http://mycs.com/schemas/furniture/wardrobe",
  "definitions": {
    "sku": {
      "type": "string",
      "description": "unique id of a component in our furniture component store",
      "pattern": "^(\\d+\\.)+[\\d]+$"
    },
    "cluster": {
      "type": "integer",
      "description": "id to mark a group of columns belonging to the same sliding door system"
    },
    "z": {
      "type": "number",
      "description": "translation along in the scene's upward direction for interior components, 0 being the bottom of the interior of the corpus",
      "pattern": "^-?\\d{1,3}(\\.\\d)*$"
    },
    "label_id": {
      "type": "string",
      "description": "element's label id"
    },
    "invisible": {
      "type": "boolean",
      "description": "determines whether element must be rendered or not"
    },
    "withoutBox": {
      "type": "boolean",
      "description": "determines whether drawers must be rendered with box or not"
    },
    "element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "label_id": { "$ref": "#/definitions/label_id" },
        "invisible": { "$ref": "#/definitions/invisible" }
      }
    },
    "positioned_element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku", "z" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "z": { "$ref": "#/definitions/z" },
        "label_id": { "$ref": "#/definitions/label_id" },
        "invisible": { "$ref": "#/definitions/invisible" }
      }
    },
    "drawer_element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku", "z" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "z": { "$ref": "#/definitions/z" },
        "label_id": { "$ref": "#/definitions/label_id" },
        "invisible": { "$ref": "#/definitions/invisible" },
        "withoutBox": { "$ref": "#/definitions/withoutBox" }
      }
    },
    "positioned_elements": {
      "type": "array",
      "uniqueItems": true,
      "items": { "$ref": "#/definitions/positioned_element" }
    },
    "drawer_elements": {
      "type": "array",
      "uniqueItems": true,
      "items": { "$ref": "#/definitions/drawer_element" }
    }
  },
  "type": "object",
  "additionalProperties": false,
  "required": [ "outer_wall_left", "outer_wall_right", "columns" ],
  "properties": {
    "outer_wall_left": { "$ref": "#/definitions/element" },
    "outer_wall_right": { "$ref": "#/definitions/element" },
    "columns": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [ "cluster", "corpus", "backwall", "doors", "boards", "drawers", "shoe_drawers", "cloth_rails", "lifts"  ],
        "properties": {
          "cluster": { "$ref": "#/definitions/cluster" },
          "corpus": { "$ref": "#/definitions/element" },
          "doors": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [ "door", "handles" ],
              "properties": {
                "door": { "$ref": "#/definitions/element" },
                "handles": {
                  "type": "array",
                  "minItems": 1,
                  "items": { "$ref": "#/definitions/element" }
                }
              }
            }
          },
          "boards": { "$ref": "#/definitions/positioned_elements" },
          "drawers": { "$ref": "#/definitions/drawer_elements" },
          "shoe_drawers": { "$ref": "#/definitions/positioned_elements" },
          "cloth_rails": { "$ref": "#/definitions/positioned_elements" },
          "lifts": { "$ref": "#/definitions/positioned_elements" },
          "backwall": { "$ref": "#/definitions/element" }
        }
      }
    }
  }
}
},{}],18:[function(require,module,exports){
module.exports={
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "http://mycs.com/schemas/furniture/wardrobe",
  "definitions": {
    "sku": {
      "type": "string",
      "description": "unique id of a component in our furniture component store",
      "pattern": "^(\\d+\\.)+[\\d]+$"
    },
    "cluster": {
      "type": "integer",
      "description": "id to mark a group of columns belonging to the same sliding door system"
    },
    "z": {
      "type": "number",
      "description": "translation along in the scene's upward direction for interior components, 0 being the bottom of the interior of the corpus",
      "pattern": "^-?\\d{1,3}(\\.\\d)*$"
    },
    "element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" }
      }
    },
    "positioned_element": {
      "type": "object",
      "additionalProperties": false,
      "required": [ "sku", "z" ],
      "properties": {
        "sku": { "$ref": "#/definitions/sku" },
        "z": { "$ref": "#/definitions/z" }
      }
    },
    "positioned_elements": {
      "type": "array",
      "uniqueItems": true,
      "items": { "$ref": "#/definitions/positioned_element" }
    }
  },
  "type": "object",
  "additionalProperties": false,
  "required": [ "outer_wall_left", "outer_wall_right", "columns" ],
  "properties": {
    "outer_wall_left": { "$ref": "#/definitions/element" },
    "outer_wall_right": { "$ref": "#/definitions/element" },
    "columns": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [ "cluster", "corpus", "backwall", "doors", "boards", "drawers", "shoe_drawers", "cloth_rails", "lifts"  ],
        "properties": {
          "cluster": { "$ref": "#/definitions/cluster" },
          "corpus": { "$ref": "#/definitions/element" },
          "doors": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [ "door", "handles" ],
              "properties": {
                "door": { "$ref": "#/definitions/element" },
                "handles": {
                  "type": "array",
                  "minItems": 1,
                  "items": { "$ref": "#/definitions/element" }
                }
              }
            }
          },
          "boards": { "$ref": "#/definitions/positioned_elements" },
          "drawers": { "$ref": "#/definitions/positioned_elements" },
          "shoe_drawers": { "$ref": "#/definitions/positioned_elements" },
          "cloth_rails": { "$ref": "#/definitions/positioned_elements" },
          "lifts": { "$ref": "#/definitions/positioned_elements" },
          "backwall": { "$ref": "#/definitions/element" }
        }
      }
    }
  }
}
},{}],19:[function(require,module,exports){
var HASH_ALGORITHM, HMAC_KEY, V, VERSION, _cloneDeep, _validateData, _validateStructure, couchtableSchema, hashingFunction, jsSHA, shelfSchema, stringifier, tableSchema, validator, wardrobeSchema;

jsSHA = require('jssha');

stringifier = require('./stringify');

V = require('jsonschema').Validator;

validator = new V();

shelfSchema = require('./json-schemas/shelf.json');

couchtableSchema = require('./json-schemas/couchtable.json');

tableSchema = require('./json-schemas/table.json');

wardrobeSchema = require('./json-schemas/wardrobe.json');

VERSION = '0.2';

HASH_ALGORITHM = 'SHA-1';

HMAC_KEY = '0111201600';

_cloneDeep = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

_validateData = function(data) {
  if (!data.hasOwnProperty('structure')) {
    throw new Error('missing structure attribute');
  }
  _validateStructure(data.structure);
  if (Object.keys(data).length !== 1) {
    throw new Error('there must be structure attribute only');
  }
};

_validateStructure = function(structure) {
  var couchtableRes, error, shelfRes, tableRes, wardrobeRes;
  structure = _cloneDeep(structure);
  shelfRes = validator.validate(structure, shelfSchema);
  couchtableRes = validator.validate(structure, couchtableSchema);
  tableRes = validator.validate(structure, tableSchema);
  wardrobeRes = validator.validate(structure, wardrobeSchema);
  if (shelfRes.errors.length && couchtableRes.errors.length && tableRes.errors.length && wardrobeRes.errors.length) {
    error = {
      structure: structure,
      schemas: {
        shelf: shelfRes.errors,
        couchtable: couchtableRes.errors,
        table: tableRes.errors,
        wardrobe: wardrobeRes.errors
      }
    };
    throw new Error('structure is invalid for any existing schema' + JSON.stringify(error, null, 2));
  }
};

hashingFunction = function(data) {
  var shaObj, stringToHash;
  data = _cloneDeep(data);
  _validateData(data);
  stringToHash = stringifier.stringify(data);
  shaObj = new jsSHA(HASH_ALGORITHM, "TEXT");
  shaObj.setHMACKey(HMAC_KEY, "TEXT");
  shaObj.update(stringToHash);
  return shaObj.getHMAC("HEX");
};

module.exports = hashingFunction;


},{"./json-schemas/couchtable.json":12,"./json-schemas/shelf.json":14,"./json-schemas/table.json":16,"./json-schemas/wardrobe.json":18,"./stringify":21,"jsonschema":3,"jssha":5}],20:[function(require,module,exports){
var HASH_ALGORITHM, HMAC_KEY, V, VERSION, _cloneDeep, _validateData, _validateStructure, couchtableSchema, hashingFunction, jsSHA, shelfSchema, stringifier, tableSchema, validator, wardrobeSchema;

jsSHA = require('jssha');

stringifier = require('./stringify');

V = require('jsonschema').Validator;

validator = new V();

shelfSchema = require('./json-schemas/shelf-image.json');

couchtableSchema = require('./json-schemas/couchtable-image.json');

tableSchema = require('./json-schemas/table-image.json');

wardrobeSchema = require('./json-schemas/wardrobe-image.json');

VERSION = '0.2';

HASH_ALGORITHM = 'SHA-1';

HMAC_KEY = '0111201600';

_cloneDeep = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

_validateStructure = function(structure) {
  var couchtableRes, error, shelfRes, tableRes, wardrobeRes;
  structure = _cloneDeep(structure);
  shelfRes = validator.validate(structure, shelfSchema);
  couchtableRes = validator.validate(structure, couchtableSchema);
  tableRes = validator.validate(structure, tableSchema);
  wardrobeRes = validator.validate(structure, wardrobeSchema);
  if (shelfRes.errors.length && couchtableRes.errors.length && tableRes.errors.length && wardrobeRes.errors.length) {
    error = {
      structure: structure,
      schemas: {
        shelf: shelfRes.errors,
        couchtable: couchtableRes.errors,
        table: tableRes.errors,
        wardrobe: wardrobeRes.errors
      }
    };
    throw new Error('structure is invalid for any existing schema' + JSON.stringify(error, null, 2));
  }
};

_validateData = function(data) {
  if (!data.hasOwnProperty('camera')) {
    throw new Error('missing camera attribute');
  }
  if (!data.camera.hasOwnProperty('angle')) {
    throw new Error('missing angle attribute in camera');
  }
  if (!(typeof data.camera.angle === 'number' && isFinite(data.camera.angle))) {
    throw new Error('invalid camera angle');
  }
  if (data.camera.hasOwnProperty('vAngle')) {
    if (!(typeof data.camera.vAngle === 'number' && isFinite(data.camera.vAngle))) {
      throw new Error('invalid camera vAngle');
    }
  }
  if (!data.hasOwnProperty('quality')) {
    throw new Error('missing quality attribute');
  }
  if (!(typeof data.quality === 'string' && data.quality)) {
    throw new Error('invalid quality attribute');
  }
  if (!data.hasOwnProperty('stage')) {
    throw new Error('missing stage attribute');
  }
  if (!(typeof data.stage === 'string' && data.stage)) {
    throw new Error('invalid stage attribute');
  }
  if (!data.hasOwnProperty('structure')) {
    throw new Error('missing structure attribute');
  }
  _validateStructure(data.structure);
  if (Object.keys(data).length !== 4) {
    throw new Error('there must exactly be the attributes: camera, structure, stage and quality');
  }
};

hashingFunction = function(data) {
  var shaObj, stringToHash;
  data = _cloneDeep(data);
  _validateData(data);
  if (data.camera.vAngle == null) {
    data.camera.vAngle = 0;
  }
  stringToHash = stringifier.stringify(data);
  shaObj = new jsSHA(HASH_ALGORITHM, "TEXT");
  shaObj.setHMACKey(HMAC_KEY, "TEXT");
  shaObj.update(stringToHash);
  return shaObj.getHMAC("HEX");
};

module.exports = hashingFunction;


},{"./json-schemas/couchtable-image.json":11,"./json-schemas/shelf-image.json":13,"./json-schemas/table-image.json":15,"./json-schemas/wardrobe-image.json":17,"./stringify":21,"jsonschema":3,"jssha":5}],21:[function(require,module,exports){
var StableJSONStringify,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

StableJSONStringify = (function() {
  function StableJSONStringify() {
    this._stringify = bind(this._stringify, this);
    this.stringify = bind(this.stringify, this);
    this._init();
  }

  StableJSONStringify.prototype.stringify = function(obj) {
    this._init();
    return this._stringify({
      '': obj
    }, '', obj, 0);
  };

  StableJSONStringify.prototype._init = function() {
    this.opts = {};
    this.space = this.opts.space || '';
    if (typeof this.space === 'number') {
      this.space = Array(this.space + 1).join(' ');
    }
    this.cycles = typeof this.opts.cycles === 'boolean' ? this.opts.cycles : false;
    this.replacer = this.opts.replacer || function(key, value) {
      return value;
    };
    return this.seen = [];
  };

  StableJSONStringify.prototype._isArray = function(x) {
    var result;
    result = Array.isArray(x);
    if (result) {
      return result;
    }
    return {}.toString.call(x) === '[object Array]';
  };

  StableJSONStringify.prototype._stringify = function(parent, key, node, level) {
    var colonSeparator, i, indent, item, j, k, keyValue, keys, out, ref, ref1, value;
    indent = '\n' + new Array(level + 1).join(this.space) ? this.space : '';
    colonSeparator = this.space ? ': ' : ':';
    if (node && node.toJSON && typeof node.toJSON === 'function') {
      node = node.toJSON();
    }
    node = this.replacer.call(parent, key, node);
    if (node == null) {
      return;
    }
    if (typeof node !== 'object' || node === null) {
      return JSON.stringify(node);
    }
    if (this._isArray(node)) {
      out = [];
      for (i = j = 0, ref = node.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        item = this._stringify(node, i, node[i], level + 1) || JSON.stringify(null);
        out.push(indent + this.space + item);
      }
      out.sort();
      return '[' + out.join(',') + indent + ']';
    } else {
      if (this.seen.indexOf(node) !== -1) {
        if (this.cycles) {
          return JSON.stringify('__cycle__');
        }
        throw new TypeError('Converting circular structure to JSON');
      } else {
        this.seen.push(node);
      }
      keys = Object.keys(node).sort();
      out = [];
      for (i = k = 0, ref1 = keys.length; 0 <= ref1 ? k < ref1 : k > ref1; i = 0 <= ref1 ? ++k : --k) {
        key = keys[i];
        value = this._stringify(node, key, node[key], level + 1);
        if (!value) {
          continue;
        }
        keyValue = JSON.stringify(key) + colonSeparator + value;
        out.push(indent + this.space + keyValue);
      }
      return '{' + out.join(',') + indent + '}';
    }
  };

  return StableJSONStringify;

})();

module.exports = new StableJSONStringify;


},{}],"mycshash":[function(require,module,exports){
module.exports = {
  hashImage: require('./mycs-hash-image'),
  hashDesign: require('./mycs-hash-design')
};


},{"./mycs-hash-design":19,"./mycs-hash-image":20}]},{},[]);
