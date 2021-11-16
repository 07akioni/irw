import { merge } from 'lodash'
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
  methods?: Method[]
  defaults?: Partial<IrwConfig<Method>>
  request(config: IrwAdapterConfig<Method>): Promise<any>
}

export type IrwRequestMethods<
  Method extends IrwLegalMethod = IrwDefaultMethod
> = {
  [key in Method]: <Data extends IrwResponseDataType = IrwResponseDataType>(
    url: string,
    config?: Omit<IrwConfig<Method>, 'url'>
  ) => Promise<IrwResponse<Data>>
}

export type IrwInstance<Method extends IrwLegalMethod = IrwDefaultMethod> = {
  interceptors: {
    request: {
      use: (
        fullfilled?: InterceptHandler<IrwConfig<Method>>['fulfilled'],
        rejected?: InterceptHandler<IrwConfig<Method>>['rejected']
      ) => void
    }
    response: {
      use: (
        fullfilled?: InterceptHandler<IrwResponse>['fulfilled'],
        rejected?: InterceptHandler<IrwResponse>['rejected']
      ) => void
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
  const irw: IrwFn<Method> = async (config) => {
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
  const { methods = ['get', 'post', 'put'] as Method[] } = adapter
  methods.forEach((key) => {
    ;(irw as unknown as IrwRequestMethods<Method>)[key] = async (
      url,
      config
    ) => {
      let mergedConfig: IrwConfig<Method> = merge({ method: key }, config, {
        url
      })
      return await irw(mergedConfig)
    }
  })

  // create instance methods
  ;(irw as unknown as IrwInstance<Method>).interceptors = {
    request: {
      use(fulfilled, rejected) {
        reqInterceptHandlers.push({
          fulfilled, rejected
        })
      }
    },
    response: {
      use(fulfilled, rejected) {
        respInterceptHandlers.push({
          fulfilled, rejected
        })
      }
    }
  }

  return irw as Irw<Method>
}
