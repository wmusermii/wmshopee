
import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { logError, logInfo } from '../utils/logger';
import { ApiResponse } from '../utils/apiResponse';
import { AuthService } from '../services/auth.service';
import { EncryptDecryptJwt } from '../utils/encryptdecryptJwt';
import { ApiService } from '../services/api.service';
const authService = new AuthService();
const apiService = new ApiService();
export async function login(req: Request, res: Response, next: NextFunction) {
  const { credential } = req.body;
  try {
    console.log("CREDENTIAL : ", credential);
    const decoded = Buffer.from(credential, 'base64').toString('utf-8');
   console.log("CREDENTIAL DECODED : ", decoded);
    const [username, password] = decoded.split(':');
    const user = await authService.login(username, password);
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
export async function registUser(req: Request, res: Response) {
  const { fullname, mobilename, email, username, password, groupCode } = req.body;
  try {
    const userExist = await authService.selectGetUserByUserID(username);
    logInfo("EEEEEEEEEEEEEEEEEE ", userExist.code > 20000)
    if(userExist.code === 20000) {
        await ResponseHelper.send(res, ApiResponse.successNoData([], "Username Already token!, please use else"));return;
    }

    const newPassword = await generatePassword()
    const payloadInser ={fullname:fullname, mobilename:mobilename, email:email, username:username, password:newPassword, groupCode:groupCode.code}
    const insertUser = await apiService.registerUser(payloadInser);
    logInfo("HASIL INSERT TABLE ", insertUser)

    await ResponseHelper.send(res, ApiResponse.success({username:username}, "Success"));return;

  } catch (error) {
    logError("Error auth.controller : ", error)
    await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
  //   {
//     "fullname": "Ryan Muktiadhi",
//     "mobilename": "087872195524",
//     "email": "wmusermii@gmail.com",
//     "username": "ryanmu",
//     "password": "",
//     "groupCode": {
//         "code": "100000000002",
//         "label": "Supervisor",
//         "description": "Oversees the work of others, guiding and managing a team to ensure tasks are completed effectively"
//     }
// }
}
async function generatePassword(): Promise<string> {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const allChars = uppercaseChars + lowercaseChars + digits;

  let password = "";

  // Pastikan ada minimal 1 huruf kapital
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));

  // Pastikan ada minimal 1 angka
  password += digits.charAt(Math.floor(Math.random() * digits.length));

  // Sisanya random
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle agar posisi huruf kapital dan angka tidak selalu di depan
  return shuffleString(password);
}

function shuffleString(str: string): string {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}
