import { Router } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { checkPackageTaken, echo, generateQShopee, generateQShopeeJobs, getItemsInPackage, getPackageJobAvailable, getQShopee, updateItemsInPackage, viewQShopeePosItem } from '../controllers/api.controller';
import { attrb, login } from '../controllers/auth.controller';
import { authBearerMiddleware } from '../middlewares/authmiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';
const router = Router();
router.get('/echo', echo);
//##################################### REAL FUNCTION#############
router.get('/shopee/get_qshopee', asyncHandler(authBearerMiddleware),asyncHandler(getQShopee)); // untuk menggenerate table q_shopee generateQShopeeJobs
router.post('/shopee/gen_qshopee', asyncHandler(authBearerMiddleware),asyncHandler(generateQShopee)); // untuk menggenerate table q_shopee
router.post('/shopee/gen_qshopee_job', asyncHandler(authBearerMiddleware),asyncHandler(generateQShopeeJobs)); // untuk menggenerate table q_shopee_invoice
router.post('/shopee/get_positem', asyncHandler(authBearerMiddleware),asyncHandler(viewQShopeePosItem)); // untuk menggenerate table q_shopee generateQShopeeJobs
//##################################### AUTH ROUTES #############
router.post('/auth/login', asyncHandler(login));
router.get('/auth/attrb',asyncHandler(authBearerMiddleware), asyncHandler(attrb));
//##################################### AUTH ROUTES #############

router.get('/warehouse/get_jobs/available', asyncHandler(authBearerMiddleware),asyncHandler(viewQShopeePosItem));
router.get('/warehouse/get_packages', asyncHandler(authBearerMiddleware),asyncHandler(getPackageJobAvailable));
router.post('/warehouse/check_taken_packages', asyncHandler(authBearerMiddleware),asyncHandler(checkPackageTaken));
router.post('/warehouse/get_items_packages', asyncHandler(authBearerMiddleware),asyncHandler(getItemsInPackage)); // Untuk melihat Posisi banyaknya Item pada resi yang ada
router.post('/warehouse/update_items_packages', asyncHandler(authBearerMiddleware),asyncHandler(updateItemsInPackage)); // Untuk mengupdate item yang sudah di kerjakan
export default router;
