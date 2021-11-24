type UploadFile = ({
  url: string
  filePath?: string // miniapp only
  name?: string // miniapp only
  header?: Record<string, any>
  formData?: Record<string, any>
  timeout?: number
  fileName?: string
  // complete?: (res: CallbackResult) => void
  // fail?: (res: CallbackResult) => void
  success?: (res: SuccessCallbackResult) => void
})

interface SuccessCallbackResult {
  data: string,
  statusCode: number
}