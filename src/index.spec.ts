import { Request } from 'servie'
import { createGzip, createDeflate } from 'zlib'
import { parse } from './'

describe('get-body', () => {
  describe('text', () => {
    it('should parse body as text', () => {
      const req = new Request({ url: '', body: 'hello world' })

      return parse(req.stream(), req.headers.object())
        .then(body => expect(body).toEqual('hello world'))
    })

    it('should support gzip', () => {
      const req = new Request({ url: '', body: 'hello world', headers: { 'Content-Encoding': 'gzip' } })

      return parse(req.stream().pipe(createGzip()), req.headers.object())
        .then(body => expect(body).toEqual('hello world'))
    })

    it('should support deflate', () => {
      const req = new Request({ url: '', body: 'hello world', headers: { 'Content-Encoding': 'deflate' } })

      return parse(req.stream().pipe(createDeflate()), req.headers.object())
        .then(body => expect(body).toEqual('hello world'))
    })
  })

  describe('json', () => {
    it('should parse body as json', () => {
      const req = new Request({ url: '', body: { hello: 'world' } })

      return parse(req.stream(), req.headers.object())
        .then(body => expect(body).toEqual({ hello: 'world' }))
    })

    it('should accept empty strings', () => {
      const req = new Request({ url: '', body: '', headers: { 'Content-Type': 'application/json' } })

      return parse(req.stream(), req.headers.object())
        .then(body => expect(body).toEqual({}))
    })

    it('should not accept primitive json', () => {
      const req = new Request({ url: '', body: JSON.stringify('test'), headers: { 'Content-Type': 'application/json; charset=utf-8' } })

      return parse(req.stream(), req.headers.object())
        .catch(err => expect(err.message).toEqual('Invalid JSON, only supports object and array'))
    })
  })

  describe('form', () => {
    it('should parse body as a form', () => {
      const req = new Request({ url: '', body: 'hello=world', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

      return parse(req.stream(), req.headers.object())
        .then(body => expect(body).toEqual({ hello: 'world' }))
    })
  })

  describe('errors', () => {
    it('should error on unknown content types', () => {
      const req = new Request({ url: '', body: '', headers: { 'Content-Type': 'foo/bar' } })

      return parse(req.stream(), req.headers.object())
        .catch(err => expect(err.message).toEqual('Unsupported content-type: foo/bar'))
    })

    it('should error on no content type', () => {
      const req = new Request({ url: '' })

      return parse(req.stream(), req.headers.object())
        .catch(err => expect(err.message).toEqual('Missing content-type'))
    })

    it('should error on unknown content encoding', () => {
      const req = new Request({ url: '', body: '', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'foobar' } })

      return parse(req.stream(), req.headers.object())
        .catch(err => expect(err.message).toEqual('Unsupport content-encoding: foobar'))
    })
  })
})
