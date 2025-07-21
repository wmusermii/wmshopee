
import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { logError, logInfo } from '../utils/logger';
import { ApiResponse } from '../utils/apiResponse';
import { AuthService } from '../services/auth.service';
import { EncryptDecryptJwt } from '../utils/encryptdecryptJwt';
const authService = new AuthService();
export async function login(req: Request, res: Response, next: NextFunction) {
  const { username, password } = req.body;
  try {
    // const payload = {code:1, message:"Login test workeds from controller"}
    const user = await authService.login(username, password);
    // logInfo("Auth.controller ",user);
    const data:any = user.data;
    if(user.code === 20000) {
      const token = await EncryptDecryptJwt.generateToken(data);
      // logInfo("Token created ",token)
      for (const key in user.data) {
        if (user.data.hasOwnProperty(key)) {
          delete user.data[key];
        }
      }
      user.data.token = token;
    }
    ResponseHelper.send(res, user);
  } catch (error) {
    logError("Error auth.controller : ", error)
    next(error);
    // ResponseHelper.send(res,ApiResponse.serverError(error+""));
  }
}
