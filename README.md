# Get Body

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Greenkeeper badge][greenkeeper-image]][greenkeeper-url]

> General HTTP request body parser.

Looking for a multipart body parser? Try [`busboy`](https://www.npmjs.com/package/busboy).

## Installation

```
npm install get-body --save
```

## Usage

```ts
import { parse, json, text, form } from 'get-body'
import { createServer } from 'http'

createServer(function (req) {
  parse(req, req.headers).then(body => console.log(body))
})
```

### Arguments

1. `stream: Readable` An instance of the request stream
2. `headers: object` The raw headers object as a lower-cased map
3. `options: object` Parser configuration

### Options

* `limit` Controls the maximum request body size (default: `100kb`).
* `decoders` Map of known `content-encoding` decoders (default: `exports.decoders`)
* `jsonParse` Custom behaviour for JSON parsing (default: strict `JSON.parse` check)
* `formParse` Custom behaviour for form parsing (default: `querystring.parse`)
* `jsonTypes` Array of media types to parse as JSON
* `formTypes` Array of media types to parse as a form
* `textTypes` Array of media types to parse as text

## TypeScript

This project is written using [TypeScript](https://github.com/Microsoft/TypeScript) and publishes the definitions directly to NPM.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/get-body.svg?style=flat
[npm-url]: https://npmjs.org/package/get-body
[downloads-image]: https://img.shields.io/npm/dm/get-body.svg?style=flat
[downloads-url]: https://npmjs.org/package/get-body
[travis-image]: https://img.shields.io/travis/blakeembrey/node-get-body.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/node-get-body
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/node-get-body.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/node-get-body?branch=master
[greenkeeper-image]: https://badges.greenkeeper.io/blakeembrey/node-get-body.svg
[greenkeeper-url]: https://greenkeeper.io/
