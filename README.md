# irw

`irw` means `isomorphic request wrapper`.

You can use it to wrap different http request clients into a isomorphic request client.

```ts
import { irw } from "irw";

// for axios
const request = irw({
  request: axios
});

// for weixin miniapp
const request = irw({
  request: wx.request
});

// interceptor
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
request.get('/url', { params: {} }).then()
request.post('/url', { data: {} }).then()
request({
  url: '/url'
  method: 'post',
  data: {}
}).then()
```
