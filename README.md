# irw

`irw` means `isomorphic request wrapper`.

You can use it to wrap different http request clients into a isomorphic request client.

`irw` 意思是 `同构请求包装器`。

你可以使用它去包装不同的 http 库，获取统一的请求接口。

## Features

- request(config)
- request.get(url, config)
- request.post(url, config)
- request.put(url, config)
- interceptors

## Todo

- progress
- cancel

## Examples

```ts
import { irw } from "irw";

// for axios
// 使用 axios
const request = irw({
  request: axios
});

// for weixin miniapp
// 使用微信小程序
const request = irw({
  request: wx.request
});

// interceptor
// 拦截器
request.interceptors.request.use((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      token: "foo",
    },
  };
});

request.interceptors.request.use(async (config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      token: await getToken(),
    },
  };
});

// request
// Currently only get, post and post is supports
request.get('/url', { params: {} }).then()
request.post('/url', { data: {}, params: {} }).then()
request.put('/url', { data: {}, params: {} }).then()
request({
  url: '/url'
  method: 'post',
  data: {}
}).then()
```
