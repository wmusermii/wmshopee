
import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { logError } from '../utils/logger';
import { ApiResponse } from '../utils/apiResponse';
export function echo(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = {code:1, message:"Echo test workeds from controller"}
    ResponseHelper.send(res, ApiResponse.success(payload,"Echoing!"));
  } catch (error) {
    logError("Error api.controller : ", error)
    next(error);
    // ResponseHelper.send(res,ApiResponse.serverError(error+""));

  }
}
