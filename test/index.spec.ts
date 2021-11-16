import axios from 'axios'
import express from 'express'
import { Server } from 'http'
import { createIrw } from '../src'

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
      const request = createIrw({
        defaults: {
          baseUrl: 'http://localhost:1548'
        },
        request(config) {
          return axios(config)
        }
      })
      const resp = await request.get(testData.request.path, {
        headers: testData.request.headers,
        data: testData.request.data
      })
      expect(resp.data).toEqual(testData.response.data)
    })
  })

  it('interceptor', async () => {
    const request = createIrw({
      defaults: {
        baseUrl: 'http://localhost:1548'
      },
      request(config) {
        return axios(config)
      }
    })
    request.interceptors.request.use({
      fulfilled(config) {
        config.url += '-x'
        return config
      }
    })
    const resp = await request.get('/foo')
    expect(resp.data).toEqual({
      foo: 'get-bar-x'
    })
  })
})
