
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
      const uInfo = JSON.parse(JSON.stringify(data)); // agar data tidak hilang

      for (const key in user.data) {
        if (user.data.hasOwnProperty(key)) {
          delete user.data[key];
        }
      }
      // logInfo("############################UINFO 2 : ",uInfo)
      delete uInfo.menublob;
      user.data.token = token;
      user.data.userinfo = uInfo;
    }
    await ResponseHelper.send(res, user);return;
  } catch (error) {
    logError("Error auth.controller : ", error)
    // next(error);
    await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}
export async function attrb(req: Request, res: Response) {
  try {
    // const user = await authService.login(username, password);
    // logInfo("Auth.controller ",user);
    const data:any = req.userInfo;
    // console.log("USER INFO ",data.code);
    if(data.code === 'ERR_JWT_EXPIRED') {
      await ResponseHelper.send(res, ApiResponse.invalidToken(data.code));return;
    } else {
      await ResponseHelper.send(res, ApiResponse.success(data,"Success Attrb"));return;
    }
  } catch (error) {
    logError("Error auth.controller : ", error)
    await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}
