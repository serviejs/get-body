import { Readable } from 'stream'
import { createGunzip, createInflate } from 'zlib'
import { parse as formParse } from 'querystring'
import getRawBody = require('raw-body')
import createError = require('http-errors')

const DEFAULT_LIMIT = 100 * 1024 // 100kb.
const DEFAULT_ENCODING = 'utf8'

// Allowed whitespace is defined in RFC 7159.
// http://www.rfc-editor.org/rfc/rfc7159.txt
const STRICT_JSON_REGEXP = /^[\x20\x09\x0a\x0d]*[\[\{]/

export interface Headers {
  [key: string]: string | string[]
}

export interface Options {
  limit?: number
  encoding?: string
  decoders?: Decoders
  jsonTypes?: string[]
  formTypes?: string[]
  textTypes?: string[]
  jsonParse?: (str: string) => any
  formParse?: (str: string) => any
}

export interface Decoders {
  [key: string]: (stream: Readable) => Readable
}

/**
 * Supported encodings.
 */
export const decoders: Decoders = {
  deflate: (stream) => stream.pipe(createInflate()),
  gzip: (stream) => stream.pipe(createGunzip())
}

/**
 * Default JSON parser.
 */
function jsonParse (str: string) {
  if (str.length === 0) {
    return {}
  }

  if (!STRICT_JSON_REGEXP.test(str)) {
    throw createError(400, 'Invalid JSON, only supports object and array')
  }

  return JSON.parse(str)
}

/**
 * Default support content types.
 */
export const jsonTypes = ['application/json']
export const formTypes = ['application/x-www-form-urlencoded']
export const textTypes = ['text/plain', 'text/html']

/**
 * Parse any incoming stream.
 */
export function parse (stream: Readable, headers: Headers, options: Options = {}) {
  const type = getType(headers)

  if (!type) {
    return Promise.reject(createError(415, 'Missing content-type'))
  }

  const jsonType = options.jsonTypes || jsonTypes

  if (jsonType.indexOf(type) > -1) {
    return json(stream, headers, options)
  }

  const formType = options.formTypes || formTypes

  if (formType.indexOf(type) > -1) {
    return form(stream, headers, options)
  }

  const textType = options.textTypes || textTypes

  if (textType.indexOf(type) > -1) {
    return text(stream, headers, options)
  }

  return Promise.reject(createError(415, `Unsupported content-type: ${type}`))
}

/**
 * Parse the stream as JSON.
 */
export function json (stream: Readable, headers: Headers, options: Options = {}) {
  return text(stream, headers, options).then(options.jsonParse || jsonParse)
}

/**
 * Parse the stream as a form.
 */
export function form (stream: Readable, headers: Headers, options: Options = {}) {
  return text(stream, headers, options).then(options.formParse || formParse)
}

/**
 * Parse the stream as text.
 */
export function text (stream: Readable, headers: Headers, options: Options = {}): Promise<string> {
  const [err, req, length] = inflate(stream, headers, options.decoders)

  if (err) {
    return Promise.reject<string>(err)
  }

  const limit = options.limit || DEFAULT_LIMIT
  const encoding = options.encoding || DEFAULT_ENCODING

  return getRawBody(req, { length, limit, encoding })
}

/**
 * Inflate the readable stream.
 */
export function inflate (
  stream: Readable,
  headers: Headers,
  encoding: Decoders = decoders
): [createError.HttpError| undefined, Readable, number | undefined] {
  const enc = String(headers['content-encoding'] || 'identity').toLowerCase()

  if (enc === 'identity') {
    return [undefined, stream, ~~headers['content-length']]
  }

  if (encoding[enc]) {
    return [undefined, encoding[enc](stream), undefined]
  }

  return [createError(`Unsupport content-encoding: ${enc}`), stream, undefined]
}

/**
 * Return the `content-type` string.
 */
export function getType (headers: Headers) {
  let contentType = headers['content-type']

  if (!contentType) {
    return
  }

  if (Array.isArray(contentType)) {
    contentType = contentType[0]
  }

  const index = contentType.indexOf(';')

  return index > -1 ? contentType.substr(0, index) : contentType
}
