# irq

`irq` means `isomorphic request wrapper`.

You can use it to wrap different http request client into a isomorphic way.

```ts
import { irq } from "irq";

// for axios
const request = irq({
  request(config) {
    return axios(config);
  },
});

// for weixin miniapp
const request = irq({
  request(config) {
    wx.request(config);
  },
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

// request
request.get('/url', { params: {} }).then()
request.post('/url', { data: {} }).then()
request({
  url: '/url'
  method: 'post',
  data: {}
}).then()
```
