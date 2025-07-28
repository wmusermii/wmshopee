import { Router } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { echo, generateQShopee, generateQShopeeJobs, getQShopee } from '../controllers/api.controller';
import { attrb, login } from '../controllers/auth.controller';
import { authBearerMiddleware } from '../middlewares/authmiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';
const router = Router();
router.get('/echo', echo);
//##################################### REAL FUNCTION#############
router.get('/shopee/get_qshopee', asyncHandler(authBearerMiddleware),asyncHandler(getQShopee)); // untuk menggenerate table q_shopee generateQShopeeJobs
router.post('/shopee/gen_qshopee', asyncHandler(authBearerMiddleware),asyncHandler(generateQShopee)); // untuk menggenerate table q_shopee
router.post('/shopee/gen_qshopee_job', asyncHandler(authBearerMiddleware),asyncHandler(generateQShopeeJobs)); // untuk menggenerate table q_shopee_invoice
//##################################### AUTH ROUTES #############
router.post('/auth/login', asyncHandler(login));
router.get('/auth/attrb',asyncHandler(authBearerMiddleware), asyncHandler(attrb));
//##################################### AUTH ROUTES #############
export default router;
