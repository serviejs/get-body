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
  if (str.length === 0) return {}

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

  if (!type) return Promise.reject(createError(415, 'Missing content-type'))

  const jsonType = options.jsonTypes || jsonTypes
  const formType = options.formTypes || formTypes
  const textType = options.textTypes || textTypes

  if (jsonType.indexOf(type) > -1) return json(stream, headers, options)
  if (formType.indexOf(type) > -1) return form(stream, headers, options)
  if (textType.indexOf(type) > -1) return text(stream, headers, options)

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
  const { error, body, length } = inflate(stream, headers, options.decoders)

  if (error) return Promise.reject<string>(error)

  const limit = options.limit || DEFAULT_LIMIT
  const encoding = options.encoding || DEFAULT_ENCODING

  return getRawBody(body, { length, limit, encoding })
}

/**
 * Inflate the readable stream.
 */
export function inflate (
  stream: Readable,
  headers: Headers,
  encoding: Decoders = decoders
) {
  const enc = String(headers['content-encoding'] || 'identity').toLowerCase()

  if (enc === 'identity') {
    return {
      body: stream,
      length: ~~headers['content-length']
    }
  }

  if (encoding[enc]) {
    return {
      body: encoding[enc](stream)
    }
  }

  return {
    body: stream,
    error: createError(`Unsupported content-encoding: ${enc}`)
  }
}

/**
 * Return the `content-type` string.
 */
export function getType (headers: Headers): string | undefined {
  const contentType = headers['content-type']

  if (!contentType) return undefined

  const type = Array.isArray(contentType) ? contentType[0] : contentType
  const index = type.indexOf(';')

  return index > -1 ? type.substr(0, index) : type
}
