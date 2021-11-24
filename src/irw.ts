import { merge } from 'lodash'
import {
  Irw,
  IrwAdapter,
  IrwAdapterConfig,
  IrwAdpaterResponse,
  IrwConfig,
  IrwError,
  IrwFn,
  IrwInstance,
  IrwMethod,
  IrwRequestMethods,
  IrwResponse,
  IrwInterceptHandler,
  IrwAdapterSetup,
  IrwAdapterSetupOptions,
  IrwHandle
} from './types'
import { buildFullPath, buildURL } from './utils'

export function irw(
  adapter: IrwAdapter
): Irw {
  const { defaults } = adapter
  function resolveConfig(config: IrwConfig): IrwAdapterConfig {
    const resolvedConfig: IrwConfig = merge({}, defaults, config)
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
  const reqIrwInterceptHandlers: IrwInterceptHandler<IrwConfig>[] = []
  const respIrwInterceptHandlers: IrwInterceptHandler<
    IrwResponse<any>
  >[] = []
  const irw: IrwFn = (config) => {
    let _isAbort: IrwAdapterSetupOptions['isAbort']
    let _onAbort: IrwAdapterSetupOptions['onAbort']
    let _onDownloadProgress: IrwAdapterSetupOptions['onDownloadProgress']
    let _onUploadProgress: IrwAdapterSetupOptions['onUploadProgress']
    const setup: IrwAdapterSetup = ({
      isAbort,
      onAbort,
      onDownloadProgress,
      onUploadProgress
    }) => {
      _isAbort = isAbort
      _onAbort = onAbort
      _onDownloadProgress = onDownloadProgress
      _onUploadProgress = onUploadProgress
    }
    let abortHandle: IrwHandle = {
      abort: () => {
        if (!_onAbort) {
          console.error('[irw]: `onAbort` is not setup')
          return
        }
        _onAbort()
      }
    }
    const resolveRequest = async () => {
      for (const { fulfilled, rejected } of reqIrwInterceptHandlers) {
        try {
          if (fulfilled) {
            config = await fulfilled(config)
          }
        } catch (err) {
          let isAbort = _isAbort?.(err) || false
          let irwError: IrwError = {
            isAbort,
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
      return adapter.request(resolveConfig(config), setup)
    }
    let mergedReq: Promise<IrwResponse<any>> = resolveRequest().then(
      (resp: IrwAdpaterResponse<any>): IrwResponse<any> => {
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
    for (const { fulfilled, rejected } of respIrwInterceptHandlers) {
      mergedReq = mergedReq.then(fulfilled, rejected)
    }
    return Object.assign(mergedReq, abortHandle)
  }

  // create request methods
  const { methods = ['get', 'post', 'put'] as IrwMethod[] } = adapter
  methods.forEach((key) => {
    ;(irw as unknown as IrwRequestMethods)[key] = (url, config) => {
      let mergedConfig: IrwConfig = merge({ method: key }, config, {
        url
      })
      return irw(mergedConfig)
    }
  })

  // create instance methods
  ;(irw as unknown as IrwInstance).interceptors = {
    request: {
      use(fulfilled, rejected) {
        reqIrwInterceptHandlers.push({
          fulfilled,
          rejected
        })
      }
    },
    response: {
      use(fulfilled, rejected) {
        respIrwInterceptHandlers.push({
          fulfilled,
          rejected
        })
      }
    }
  }

  return irw as Irw
}
