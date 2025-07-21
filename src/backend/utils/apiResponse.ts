import { ResponseCode } from "../utils/responseCode";

export class ApiResponse<T> {
    code: ResponseCode;
    message: string;
    data: T | null;
  
    constructor(code: ResponseCode, message: string, data: T | null = null) {
      this.code = code;
      this.message = message;
      this.data = data;
    }
    static success<T>(data: T, message:string | null = "Success") {
      return new ApiResponse<T>(ResponseCode.SUCCESS, message??"Success", data);
    }
    static successNoData<T>(data: T, message:string | null = "Success") {
      return new ApiResponse<T>(ResponseCode.SUCCESS_NO_DATA, message??"Success", data);
    }
    static created<T>(data: T, message:string | null = "Created successfully") {
      return new ApiResponse<T>(ResponseCode.CREATED, message??"Created successfully", data);
    }
    static badRequest<T>(data: T,message:string | null = "Bad request") {
      return new ApiResponse<null>(ResponseCode.BAD_REQUEST, message??"Bad request", null);
    }
    static invalidToken(message:string | null = "Token expired") {
      return new ApiResponse<null>(ResponseCode.INVALID_TOKEN, message??"Token expired", null);
    }
    static notFound(message:string | null = "Not found") {
      return new ApiResponse<null>(ResponseCode.NOT_FOUND, message??"Not found", null);
    }
    static serverError(message:string | null = "Internal server error") {
      return new ApiResponse<null>(ResponseCode.SERVER_ERROR, message??"Internal server error", null);
    }
    static serviceUnsuportedMediaType(message:string | null = "Unsupported Media Type: Only application/json is allowed") {
      return new ApiResponse<null>(ResponseCode.UNSUPORTED_MEDIATYPE, message??"Unsupported Media Type: Only application/json is allowed", null);
    }
    static serviceUnavailable(message:string | null = "Service unavailable") {
      return new ApiResponse<null>(ResponseCode.SERVICE_UNAVAILABLE, message??"Service unavailable", null);
    }
    static serviceUnauthorised(message:string | null = "Service unauthorized") {
        return new ApiResponse<null>(ResponseCode.UNAUTHORIZED, message??"Service unauthorized", null);
      }
    static validationError(errors: any) {
      return new ApiResponse<null>(ResponseCode.BAD_REQUEST, errors, null);
    }
}