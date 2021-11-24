export type IrwMethod = 'get' | 'post' | 'put'
// | 'delete'
// | 'head'
// | 'options'
// | 'patch'
// | 'purge'
// | 'link'
// | 'unlink'

export type IrwResponseData = object | string | ArrayBuffer

export type IrwDefaultResponseData = IrwResponseData

export type IrwAdpaterResponse<
  Data extends IrwResponseData = IrwDefaultResponseData
> = (
  | {
      status: number
    }
  | {
      statusCode: number // Both statusCode and status are compitable
    }
) & {
  headers: Record<string, string>
  data: Data
}

export type IrwResponse<Data extends IrwResponseData = IrwDefaultResponseData> =
  {
    request: {
      config: IrwConfig
    }
    statusCode: number
    headers: Record<string, string>
    data: Data
  }

export type IrwDefaultResponse = IrwResponse

export type IrwHeaders = Record<string, string>

export interface IrwConfig {
  baseUrl?: string
  url: string
  headers?: IrwHeaders
  method?: IrwMethod
  params?: Record<string, string | number>
  data?: Record<string, string> | string | ArrayBuffer
  responseType?: 'text' | 'json' | 'arraybuffer'
}

export type IrwAdapterConfig = Omit<IrwConfig, 'params' | 'baseUrl'>

export type IrwAdapterSetupOptions = {
  isAbort?: (err: Error) => boolean
  onAbort?: () => void
  onUploadProgress?: () => void
  onDownloadProgress?: () => void
}

export type IrwAdapterSetup = (options: IrwAdapterSetupOptions) => void

export interface IrwAdapter {
  methods?: IrwMethod[]
  defaults?: Partial<IrwConfig>
  request(
    config: IrwAdapterConfig,
    setup: IrwAdapterSetup
  ): Promise<IrwAdpaterResponse<IrwDefaultResponseData>>
}

export type IrwRequestMethods = {
  [key in IrwMethod]: <Data extends IrwResponseData = IrwResponseData>(
    url: string,
    config?: Omit<IrwConfig, 'url'>
  ) => Promise<IrwResponse<Data>> & { abort: () => void }
}

export type IrwInstance = {
  interceptors: {
    request: {
      use: (
        fullfilled?: IrwInterceptHandler<IrwConfig>['fulfilled'],
        rejected?: IrwInterceptHandler<IrwConfig>['rejected']
      ) => void
    }
    response: {
      use: (
        fullfilled?: IrwInterceptHandler<
          IrwResponse<IrwDefaultResponseData>
        >['fulfilled'],
        rejected?: IrwInterceptHandler<
          IrwResponse<IrwDefaultResponseData>
        >['rejected']
      ) => void
    }
  }
}

export type IrwHandle = { abort: () => void }

export type IrwFn = <Data extends IrwResponseData = IrwDefaultResponseData>(
  config: IrwConfig
) => Promise<IrwResponse<Data>> & IrwHandle

export type Irw = IrwFn & IrwRequestMethods & IrwInstance

export interface IrwError extends Error {
  isAbort: boolean
  config: IrwConfig
  originalError: Error
}

export type IrwInterceptHandler<T> = {
  fulfilled?: (data: T) => T | Promise<T>
  rejected?: (error: Error) => any | Promise<any>
}
