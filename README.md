# Get Body

[![NPM version](https://img.shields.io/npm/v/get-body.svg?style=flat)](https://npmjs.org/package/get-body)
[![NPM downloads](https://img.shields.io/npm/dm/get-body.svg?style=flat)](https://npmjs.org/package/get-body)
[![Build status](https://img.shields.io/travis/serviejs/get-body.svg?style=flat)](https://travis-ci.org/serviejs/get-body)
[![Test coverage](https://img.shields.io/coveralls/serviejs/get-body.svg?style=flat)](https://coveralls.io/r/serviejs/get-body?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/serviejs/get-body.svg)](https://greenkeeper.io/)

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

Apache 2.0
