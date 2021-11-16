import { merge } from 'lodash-es'
import {
  IrwDefaultMethod,
  IrwHeaders,
  IrwLegalMethod,
  IrwResponse,
  IrwResponseDataType
} from './types'
import { buildFullPath, buildURL } from './utils'

export interface IrwConfig<Method extends IrwLegalMethod = IrwDefaultMethod> {
  baseUrl?: string
  url: string
  headers?: IrwHeaders
  method?: Method
  params?: Record<string, string | number>
  data?: Record<string, string> | string | ArrayBuffer
}

export type IrwAdapterConfig<Method extends IrwLegalMethod = IrwDefaultMethod> =
  Omit<IrwConfig<Method>, 'baseUrl' | 'params'>

export interface IrwAdapter<Method extends IrwLegalMethod = IrwDefaultMethod> {
  methods: Method[]
  defaults: IrwConfig<Method>
  request(config: IrwAdapterConfig<Method>): Promise<any>
}

export type IrwRequestMethods<
  Method extends IrwLegalMethod = IrwDefaultMethod
> = {
  [key in Method]: <Data extends IrwResponseDataType = IrwResponseDataType>(
    url: string,
    config: IrwConfig<Method>
  ) => Promise<IrwResponse<Data>>
}

export type IrwInstance<Method extends IrwLegalMethod = IrwDefaultMethod> = {
  interceptors: {
    request: {
      use: (handler: InterceptHandler<IrwConfig<Method>>) => void
    }
    response: {
      use: (handler: InterceptHandler<IrwResponse>) => void
    }
  }
}

export type IrwFn<Method extends IrwLegalMethod = IrwDefaultMethod> = <
  Data extends IrwResponseDataType = IrwResponseDataType
>(
  config: IrwConfig<Method>
) => Promise<IrwResponse<Data>>

export type Irw<Method extends IrwLegalMethod = IrwDefaultMethod> =
  IrwFn<Method> & IrwRequestMethods<Method> & IrwInstance

export interface IrwError<Method extends IrwLegalMethod = IrwDefaultMethod>
  extends Error {
  irwConfig: IrwConfig<Method>
  isIrwError: boolean
}

export type InterceptHandler<T> = {
  fulfilled?: (data: T) => T
  rejected?: (error: Error) => void
}

export function createIrw<Method extends IrwLegalMethod = IrwDefaultMethod>(
  adapter: IrwAdapter<Method>
): Irw<Method> {
  const { defaults } = adapter
  function resolveConfig(config: IrwConfig<Method>): IrwAdapterConfig<Method> {
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
  const reqInterceptHandlers: InterceptHandler<IrwConfig<Method>>[] = []
  const respInterceptHandlers: InterceptHandler<IrwResponse>[] = []
  const requestable: IrwFn<Method> = async (config) => {
    for (const { fulfilled, rejected } of reqInterceptHandlers) {
      try {
        if (fulfilled) {
          config = await fulfilled(config)
        }
      } catch (err) {
        let irwError: IrwError<Method> = err
        irwError.irwConfig = config
        irwError.isIrwError = true
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
    ;(requestable as unknown as IrwRequestMethods<Method>)[key] = async (
      url,
      config
    ) => {
      let mergedConfig: IrwConfig<Method> = merge({ method: key }, config, {
        url
      })
      return await requestable(mergedConfig)
    }
  })

  // create instance methods
  ;(requestable as unknown as IrwInstance<Method>).interceptors = {
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

  return requestable as Irw<Method>
}
