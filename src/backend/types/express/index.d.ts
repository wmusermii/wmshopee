declare global {
  namespace Express {
    interface Request {
      userInfo?: any;
    }
  }
}
export {}; // ⬅️ penting agar dianggap sebagai "external module"
