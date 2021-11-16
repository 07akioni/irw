import axios from 'axios'
import { Irw, irw } from '../src'

const request = irw({
  request: axios
})

function useToken(request: Irw, config: {
  getToken: () => Promise<string>
}): void {
  let currentToken = ''
  request.interceptors.request.use((config) => {
    return {
      ...config,
      headers: {
        ...config.headers,
        token: 'foo'
      }
    }
  })
}
