import { merge } from 'lodash'
import {
  InterceptHandler,
  Irw,
  IrwAdapter,
  IrwAdapterConfig,
  IrwAdpaterResponse,
  IrwConfig,
  IrwDefaultMethod,
  IrwDefaultResponseData,
  IrwError,
  IrwFn,
  IrwInstance,
  IrwLegalMethod,
  IrwRequestMethods,
  IrwResponse
} from './types'
import { buildFullPath, buildURL } from './utils'

export function irw<Method extends IrwLegalMethod = IrwDefaultMethod>(
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
  const respInterceptHandlers: InterceptHandler<
    IrwResponse<IrwDefaultResponseData, Method>
  >[] = []
  const irw: IrwFn<Method> = async (config) => {
    for (const { fulfilled, rejected } of reqInterceptHandlers) {
      try {
        if (fulfilled) {
          config = await fulfilled(config)
        }
      } catch (err) {
        let irwError: IrwError<Method> = {
          name: err.name,
          config: config,
          message: err.message,
          stack: err.stack,
          originalError: err
        }
        if (rejected) {
          await rejected(irwError)
        }
        break
      }
    }
    let adapterReq = adapter.request(resolveConfig(config))
    let mergedReq: Promise<IrwResponse<any, Method>> = adapterReq.then(
      (resp: IrwAdpaterResponse<any>) => {
        let mergedResp: IrwResponse<any, Method> = resp as IrwResponse<
          any,
          Method
        >
        mergedResp.request = {
          config
        }
        return mergedResp
      },
      (err) => {
        throw err
      }
    )
    for (const { fulfilled, rejected } of respInterceptHandlers) {
      mergedReq = mergedReq.then(fulfilled, rejected)
    }
    return mergedReq
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
          fulfilled,
          rejected
        })
      }
    },
    response: {
      use(fulfilled, rejected) {
        respInterceptHandlers.push({
          fulfilled,
          rejected
        })
      }
    }
  }

  return irw as Irw<Method>
}