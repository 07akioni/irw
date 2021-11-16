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

export type IrwResponseDataType = object | string | ArrayBuffer

export type IrwResponse<
  Data extends IrwResponseDataType = IrwResponseDataType
> = {
  statusCode: number
  header: Record<string, string>
  data: Data
}

export type IrwDefaultResponse = IrwResponse

export type IrwHeaders = Record<string, string>
