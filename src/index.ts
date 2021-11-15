import { merge } from 'lodash-es'
import {
  RequestableDefaultMethod,
  RequestableHeaders,
  RequestableLegalMethod,
  RequestableResponse,
  RequestableResponseDataType
} from './types'
import { buildFullPath, buildURL } from './utils'

interface RequestableConfig<
  Method extends RequestableLegalMethod = RequestableDefaultMethod
> {
  baseUrl?: string
  url: string
  header?: RequestableHeaders
  method?: Method
  params?: Record<string, string | number>
  data?: Record<string, string> | string | ArrayBuffer
}

type RequestableAdapterConfig<
  Method extends RequestableLegalMethod = RequestableDefaultMethod
> = Omit<RequestableConfig<Method>, 'baseUrl' | 'params'>

interface RequestableAdapter<
  Method extends RequestableLegalMethod = RequestableDefaultMethod
> {
  methods: Method[]
  defaults: RequestableConfig<Method>
  request(config: RequestableAdapterConfig<Method>): Promise<any>
}

type RequestableRequestMethods<
  Method extends RequestableLegalMethod = RequestableDefaultMethod
> = {
  [key in Method]: <
    Data extends RequestableResponseDataType = RequestableResponseDataType
  >(
    url: string,
    config: RequestableConfig<Method>
  ) => Promise<RequestableResponse<Data>>
}

type RequestableInstance<
  Method extends RequestableLegalMethod = RequestableDefaultMethod
> = {
  interceptors: {
    request: {
      use: (handler: InterceptHandler<RequestableConfig<Method>>) => void
    }
    response: {
      use: (handler: InterceptHandler<RequestableResponse>) => void
    }
  }
}

type RequestableFn<
  Method extends RequestableLegalMethod = RequestableDefaultMethod
> = <Data extends RequestableResponseDataType = RequestableResponseDataType>(
  config: RequestableConfig<Method>
) => Promise<RequestableResponse<Data>>

type Requestable<
  Method extends RequestableLegalMethod = RequestableDefaultMethod
> = RequestableFn<Method> &
  RequestableRequestMethods<Method> &
  RequestableInstance

type InterceptHandler<T> = {
  fulfilled?: (data: T) => T
  rejected?: (error: Error) => void
}

export function createRequestable<
  Method extends RequestableLegalMethod = RequestableDefaultMethod
>(adapter: RequestableAdapter<Method>): Requestable<Method> {
  const { defaults } = adapter
  function resolveConfig(
    config: RequestableConfig<Method>
  ): RequestableAdapterConfig<Method> {
    const mergedConfig = merge({}, defaults, config)
    const { baseUrl } = mergedConfig
    mergedConfig.url = buildURL(
      buildFullPath(baseUrl, mergedConfig.url),
      mergedConfig.params
    )
    delete mergedConfig.baseUrl
    delete mergedConfig.params
    return mergedConfig
  }

  // create fn
  const reqInterceptHandlers: InterceptHandler<RequestableConfig<Method>>[] = []
  const respInterceptHandlers: InterceptHandler<RequestableResponse>[] = []
  const requestable: RequestableFn<Method> = async (config) => {
    for (const { fulfilled, rejected } of reqInterceptHandlers) {
      try {
        if (fulfilled) {
          config = await fulfilled(config)
        }
      } catch (err) {
        if (rejected) {
          await rejected(err)
        }
        break
      }
    }
    let req = adapter.request(resolveConfig(config))
    for (const { fulfilled, rejected } of respInterceptHandlers) {
      req = req.then(fulfilled, rejected)
    }
    return req
  }

  // create request methods
  const { methods } = adapter
  methods.forEach((key) => {
    ;(requestable as unknown as RequestableRequestMethods<Method>)[key] =
      async (url, config) => {
        let mergedConfig: RequestableConfig<Method> = merge(
          { method: key },
          config,
          { url }
        )
        return await requestable(mergedConfig)
      }
  })

  // create instance methods
  ;(requestable as unknown as RequestableInstance<Method>).interceptors = {
    request: {
      use(handler) {
        reqInterceptHandlers.push(handler)
      }
    },
    response: {
      use(handler) {
        respInterceptHandlers.push(handler)
      }
    }
  }

  return requestable as Requestable<Method>
}
