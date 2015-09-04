# mycs-hash
> Library exposing a consistent hash generation function for the mycs api and clients application.


## Install

Please adapt examples below with the version you would like to use...

1. client side

```sh
$ bower install git+ssh://git@github.com/mycsHQ/mycs-hash#v0.2
```

2. server side

```sh
$ npm install git+ssh://git@github.com/mycsHQ/mycs-hash#v0.2
```

## Usage

The function validates that the furniture data structure has :
- `structure` attribute describing the modules that constitute the piece of furniture
- `is_label` whether the image created should be a label image or a normal one
- `furniture_type` the type furniture that is meant to be described by the structure
- `camera` the camera setup

```js
var mycsHash = require('mycs-hash');

mycsHash(furnitureDataStructure);
```

## License

 © Mycs 2015



