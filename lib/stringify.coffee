#
# Class to serialize JSON in stable way :
# it prevent ordering of the keys. This allows for instance
# to use the serialized JSON as the input for hash.
#
class StableJSONStringify

  #########################
  #
  # Constructor
  #
  #########################

  #
  # @param {object} options to setup the service
  #
  #
  constructor: ->
    @_init()



  #########################
  #
  # Public methods
  #
  #########################

  stringify: (obj) =>
    @_init()
    @_stringify({ '': obj }, '', obj, 0)


  #########################
  #
  # Private methods
  #
  #########################

  _init: ->
    @opts = {}
    @space = @opts.space || ''
    @space = Array( @space + 1 ).join(' ') if typeof @space is 'number'
    @cycles = if typeof @opts.cycles is 'boolean' then @opts.cycles else false
    @replacer = @opts.replacer || (key, value) -> value

    @seen = []


  _isArray: (x) ->
    result = Array.isArray(x)
    return result if result
    {}.toString.call(x) is '[object Array]'


  _stringify: (parent, key, node, level) =>
    indent = if '\n' + new Array(level + 1).join(@space) then @space else ''
    colonSeparator = if @space then ': ' else ':'

    if node and node.toJSON and typeof node.toJSON is 'function'
      node = node.toJSON()

    node = @replacer.call(parent, key, node)
    return unless node?

    if typeof node isnt 'object' or node is null
      return JSON.stringify(node)

    if @_isArray(node)
      out = []
      for i in [0...node.length]
        item = @_stringify(node, i, node[i], level + 1) or JSON.stringify(null)
        out.push(indent + @space + item)

      # Sort the array of JSON strings alphabetically
      out.sort()

      return '[' + out.join(',') + indent + ']'

    else
      if @seen.indexOf(node) isnt -1
        return JSON.stringify('__cycle__') if @cycles
        throw new TypeError('Converting circular structure to JSON')

      else
        @seen.push(node)

      keys = Object.keys(node).sort()
      out = []
      for i in [0...keys.length]
        key = keys[i]
        value = @_stringify(node, key, node[key], level + 1)

        continue if !value

        keyValue = JSON.stringify(key) + colonSeparator + value
        out.push(indent + @space + keyValue)

      return '{' + out.join(',') + indent + '}'


module.exports = new StableJSONStringify