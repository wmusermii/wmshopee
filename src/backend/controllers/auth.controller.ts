
import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { logError } from '../utils/logger';
import { ApiResponse } from '../utils/apiResponse';
export function login(req: Request, res: Response, next: NextFunction) {
  const { username, password } = req.body;
  try {
    // const payload = {code:1, message:"Login test workeds from controller"}
    ResponseHelper.send(res, ApiResponse.success(req.body,"Success"));
  } catch (error) {
    logError("Error auth.controller : ", error)
    next(error);
    // ResponseHelper.send(res,ApiResponse.serverError(error+""));

  }
}
