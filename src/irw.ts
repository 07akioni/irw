import { merge } from 'lodash'
import {
  InterceptHandler,
  Irw,
  IrwAdapter,
  IrwAdapterConfig,
  IrwAdpaterResponse,
  IrwConfig,
  IrwDefaultMethod,
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
    const resolvedConfig: IrwConfig<Method> = merge({}, defaults, config)
    const { baseUrl } = resolvedConfig
    resolvedConfig.url = buildURL(
      buildFullPath(baseUrl, resolvedConfig.url),
      resolvedConfig.params
    )
    delete resolvedConfig.baseUrl
    delete resolvedConfig.params
    return resolvedConfig
  }

  // create fn
  const reqInterceptHandlers: InterceptHandler<IrwConfig<Method>>[] = []
  const respInterceptHandlers: InterceptHandler<IrwResponse<any, Method>>[] = []
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
      (resp: IrwAdpaterResponse<any>): IrwResponse<any, Method> => {
        return Object.assign(resp, {
          request: {
            config
          },
          statusCode: 'statusCode' in resp ? resp.statusCode : resp.status
        })
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
