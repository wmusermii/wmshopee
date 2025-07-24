import { Router } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { echo, generateQShopee } from '../controllers/api.controller';
import { attrb, login } from '../controllers/auth.controller';
import { authBearerMiddleware } from '../middlewares/authmiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';
const router = Router();
router.get('/echo', echo);
//##################################### REAL FUNCTION#############
router.post('/shopee/gen_qshopee', asyncHandler(authBearerMiddleware),asyncHandler(generateQShopee)); // untuk menggenerate table q_shopee

//##################################### AUTH ROUTES #############
router.post('/auth/login', asyncHandler(login));
router.get('/auth/attrb',asyncHandler(authBearerMiddleware), asyncHandler(attrb));
//##################################### AUTH ROUTES #############
export default router;
