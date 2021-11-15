export type RequestableLegalMethod =
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

export type RequestableDefaultMethod =
  | 'get'
  | 'GET'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'

export type RequestableResponseDataType = object | string | ArrayBuffer

export type RequestableResponse<
  Data extends RequestableResponseDataType = RequestableResponseDataType
> = {
  statusCode: number
  header: Record<string, string>
  data: Data
}

export type RequestableDefaultResponse = RequestableResponse

export type RequestableHeaders = Record<string, string>
