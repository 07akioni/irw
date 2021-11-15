# irq

`irq` means `isomorphic request wrapper`.

You can use it to wrap different http request client into a isomorphic way.

```ts
import { irq } from "irq";

// for axios
const request = irq({
  request() {
    return axios(config);
  },
});

// for weixin miniapp
const request = irq({
  request(config) {
    wx.request(config);
  },
});

// use the request instance
request.interceptor.request.use((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      token: "foo",
    },
  };
});
```
