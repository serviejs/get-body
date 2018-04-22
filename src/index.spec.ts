import { createHeaders } from 'servie'
import { createBody, TextBody, EmptyBody } from 'servie/dist/body/node'
import { createGzip, createDeflate } from 'zlib'
import { parse } from './'

describe('get-body', () => {
  describe('text', () => {
    it('should parse body as text', async () => {
      const body = createBody('hello world')

      const result = await parse(body.stream(), body.headers.asObject())

      expect(result).toEqual('hello world')
    })

    it('should support gzip', async () => {
      const body = createBody('hello world')

      body.headers.set('Content-Encoding', 'gzip')

      const result = await parse(
        body.stream().pipe(createGzip()),
        body.headers.asObject()
      )

      expect(result).toEqual('hello world')
    })

    it('should support deflate', async () => {
      const body = createBody('hello world')

      body.headers.set('Content-Encoding', 'deflate')

      const result = await parse(
        body.stream().pipe(createDeflate()),
        body.headers.asObject()
      )

      expect(result).toEqual('hello world')
    })
  })

  describe('json', () => {
    it('should parse body as json', async () => {
      const body = createBody({ hello: 'world' })

      const result = await parse(body.stream(), body.headers.asObject())

      expect(result).toEqual({ hello: 'world' })
    })

    it('should accept empty strings', async () => {
      const body = createBody('')

      body.headers.set('Content-Type', 'application/json')

      const result = await parse(body.stream(), body.headers.asObject())

      expect(result).toEqual({})
    })

    it('should not accept primitive json', async () => {
      const rawBody = JSON.stringify('test')
      const headers = createHeaders({
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(rawBody)
      })
      const body = new TextBody({ rawBody, headers })

      expect.assertions(1)

      try {
        await parse(body.stream(), body.headers.asObject())
      } catch (e) {
        expect(e.message).toEqual('Invalid JSON, only supports object and array')
      }
    })
  })

  describe('form', () => {
    it('should parse body as a form', async () => {
      const rawBody = 'hello=world'
      const headers = createHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(rawBody)
      })
      const body = new TextBody({ rawBody, headers })

      const result = await parse(body.stream(), body.headers.asObject())

      expect(result).toEqual({ hello: 'world' })
    })
  })

  describe('errors', () => {
    it('should error on unknown content types', async () => {
      const headers = createHeaders({ 'Content-Type': 'foo/bar' })
      const body = new TextBody({ rawBody: 'foobar', headers })

      expect.assertions(1)

      try {
        await parse(body.stream(), body.headers.asObject())
      } catch (e) {
        expect(e.message).toEqual('Unsupported content-type: foo/bar')
      }
    })

    it('should error on no content type', async () => {
      const body = new EmptyBody({ rawBody: undefined })

      expect.assertions(1)

      try {
        await parse(body.stream(), body.headers.asObject())
      } catch (e) {
        expect(e.message).toEqual('Missing content-type')
      }
    })

    it('should error on unknown content encoding', async () => {
      const headers = createHeaders({
        'Content-Type': 'application/json',
        'Content-Encoding': 'foobar'
      })
      const body = new TextBody({ rawBody: 'foobar', headers })

      expect.assertions(1)

      try {
        await parse(body.stream(), body.headers.asObject())
      } catch (e) {
        expect(e.message).toEqual('Unsupported content-encoding: foobar')
      }
    })
  })
})
