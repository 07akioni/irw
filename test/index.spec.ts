import axios from 'axios'
import express from 'express'
import { Server } from 'http'
import { irw, IrwConfig } from '../src'

interface TestData {
  request: {
    method: string
    path: string
    headers?: Record<string, string>
    params?: Record<string, string>
    data?: Record<string, string>
  }
  response: {
    data: any
  }
}

const testDataList: TestData[] = [
  {
    request: {
      method: 'get',
      path: '/foo'
    },
    response: {
      data: {
        foo: 'get-bar'
      }
    }
  },
  {
    request: {
      method: 'get',
      path: '/foo-x'
    },
    response: {
      data: {
        foo: 'get-bar-x'
      }
    }
  }
]

describe('basic', () => {
  let server: Server
  beforeAll(() => {
    const app = express()
    app.use((req, resp) => {
      for (const testData of testDataList) {
        if (
          testData.request.method.toLowerCase() === req.method.toLowerCase() &&
          testData.request.path === req.path
        ) {
          resp.type('json').send(testData.response.data)
          return
        }
      }
    })
    server = app.listen(1548)
  })
  afterAll(() => {
    server.close()
  })

  testDataList.forEach((testData, i) => {
    it('case ' + i, async () => {
      const request = irw({
        defaults: {
          baseUrl: 'http://localhost:1548'
        },
        request: axios
      })
      const resp = await request.get(testData.request.path, {
        headers: testData.request.headers,
        data: testData.request.data
      })
      expect(resp.data).toEqual(testData.response.data)
    })
  })

  it('has irw config in repsonse', async () => {
    const config: IrwConfig = {
      baseUrl: 'http://localhost:1548',
      url: '/foo',
      method: 'get'
    }
    const request = irw({
      request: axios
    })
    const resp = await request(config)
    expect(resp.request.config).toEqual(config)
  })

  it('interceptor', async () => {
    const request = irw({
      defaults: {
        baseUrl: 'http://localhost:1548'
      },
      request: axios
    })
    request.interceptors.request.use((config) => {
      config.url += '-x'
      return config
    })
    const resp = await request.get('/foo')
    expect(resp.data).toEqual({
      foo: 'get-bar-x'
    })
  })

  it('async interceptor', async () => {
    const request = irw({
      defaults: {
        baseUrl: 'http://localhost:1548'
      },
      request: axios
    })
    request.interceptors.request.use(async (config) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      config.url += '-x'
      return config
    })
    const resp = await request.get('/foo')
    expect(resp.data).toEqual({
      foo: 'get-bar-x'
    })
  })
})
