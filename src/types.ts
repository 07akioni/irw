export type IrwLegalMethod =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'purge'
  | 'PURGE'
  | 'link'
  | 'LINK'
  | 'unlink'
  | 'UNLINK'

export type IrwDefaultMethod =
  | 'get'
  | 'GET'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'

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
