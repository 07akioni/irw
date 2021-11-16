export type IrwLegalMethod =
  | 'get'
  | 'delete'
  | 'head'
  | 'options'
  | 'post'
  | 'put'
  | 'patch'
  | 'purge'
  | 'link'
  | 'unlink'

export type IrwDefaultMethod = 'get' | 'post' | 'put'

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

export type IrwResponse<
  Data extends IrwResponseData = IrwDefaultResponseData,
  Method extends IrwLegalMethod = IrwDefaultMethod
> = {
  request: {
    config: IrwConfig<Method>
  }
  statusCode: number
  headers: Record<string, string>
  data: Data
}

export type IrwDefaultResponse = IrwResponse

export type IrwHeaders = Record<string, string>

export interface IrwConfig<Method extends IrwLegalMethod = IrwDefaultMethod> {
  baseUrl?: string
  url: string
  headers?: IrwHeaders
  method?: Method
  params?: Record<string, string | number>
  data?: Record<string, string> | string | ArrayBuffer
  responseType?: 'text' | 'json' | 'arraybuffer'
}

export type IrwAdapterConfig<Method extends IrwLegalMethod = IrwDefaultMethod> =
  Omit<IrwConfig<Method>, 'params' | 'baseUrl'>
export interface IrwAdapter<Method extends IrwLegalMethod = IrwDefaultMethod> {
  methods?: Method[]
  defaults?: Partial<IrwConfig<Method>>
  request(
    config: IrwAdapterConfig<Method>
  ): Promise<IrwAdpaterResponse<IrwDefaultResponseData>>
}

export type IrwRequestMethods<
  Method extends IrwLegalMethod = IrwDefaultMethod
> = {
  [key in Method]: <Data extends IrwResponseData = IrwResponseData>(
    url: string,
    config?: Omit<IrwConfig<Method>, 'url'>
  ) => Promise<IrwResponse<Data, Method>>
}

export type IrwInstance<Method extends IrwLegalMethod = IrwDefaultMethod> = {
  interceptors: {
    request: {
      use: (
        fullfilled?: IrwInterceptHandler<IrwConfig<Method>>['fulfilled'],
        rejected?: IrwInterceptHandler<IrwConfig<Method>>['rejected']
      ) => void
    }
    response: {
      use: (
        fullfilled?: IrwInterceptHandler<
          IrwResponse<IrwDefaultResponseData, Method>
        >['fulfilled'],
        rejected?: IrwInterceptHandler<
          IrwResponse<IrwDefaultResponseData, Method>
        >['rejected']
      ) => void
    }
  }
}

export type IrwFn<Method extends IrwLegalMethod = IrwDefaultMethod> = <
  Data extends IrwResponseData = IrwDefaultResponseData
>(
  config: IrwConfig<Method>
) => Promise<IrwResponse<Data, Method>>

export type Irw<Method extends IrwLegalMethod = IrwDefaultMethod> =
  IrwFn<Method> & IrwRequestMethods<Method> & IrwInstance

export interface IrwError<Method extends IrwLegalMethod = IrwDefaultMethod>
  extends Error {
  config: IrwConfig<Method>
  originalError: Error
}

export type IrwInterceptHandler<T> = {
  fulfilled?: (data: T) => T | Promise<T>
  rejected?: (error: Error) => any | Promise<any>
}
