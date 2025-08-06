import { Router } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { checkPackageTaken, echo, generateQShopee, generateQShopeeJobs, getAllSKUAvailable, getCountInvoicesAvailable, getCountSKUAvailable, getItemsInPackage, getPackageJobAvailable, getQShopee, getShopInfo, getShopPerformance, sendingEmailTo, updateItemsInPackage, viewQShopeePosItem } from '../controllers/api.controller';
import { attrb, login, registUser } from '../controllers/auth.controller';
import { authBearerMiddleware } from '../middlewares/authmiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';
const router = Router();
router.get('/echo', echo);
//##################################### REAL FUNCTION#############
router.get('/shopee/get_qshopee', asyncHandler(authBearerMiddleware),asyncHandler(getQShopee)); // untuk menggenerate table q_shopee generateQShopeeJobs
router.post('/shopee/gen_qshopee', asyncHandler(authBearerMiddleware),asyncHandler(generateQShopee)); // untuk menggenerate table q_shopee
router.post('/shopee/gen_qshopee_job', asyncHandler(authBearerMiddleware),asyncHandler(generateQShopeeJobs)); // untuk menggenerate table q_shopee_invoice
router.post('/shopee/get_positem', asyncHandler(authBearerMiddleware),asyncHandler(viewQShopeePosItem)); // untuk menggenerate table q_shopee generateQShopeeJobs
router.get('/shopee/get_shop_performance', asyncHandler(authBearerMiddleware),asyncHandler(getShopPerformance)); // untuk mendapatka performa toko terhadap shopee
router.get('/shopee/get_shop_info', asyncHandler(authBearerMiddleware),asyncHandler(getShopInfo)); //mendapatkan Info toko dari Shopee
//##################################### AUTH ROUTES #############
router.post('/auth/login', asyncHandler(login));
router.post('/auth/registuser', asyncHandler(registUser));
router.get('/auth/attrb',asyncHandler(authBearerMiddleware), asyncHandler(attrb));
//##################################### AUTH ROUTES #############

router.get('/warehouse/get_jobs/available', asyncHandler(authBearerMiddleware),asyncHandler(viewQShopeePosItem));// Untuk mengambil Jobs / POS barang list dalam Inquery Shopee yang available
router.get('/warehouse/get_packages', asyncHandler(authBearerMiddleware),asyncHandler(getPackageJobAvailable));// Untuk mengambil Packaging list dalam Jobs yang available
router.post('/warehouse/check_taken_packages', asyncHandler(authBearerMiddleware),asyncHandler(checkPackageTaken));// Untuk cek apaka package yang di ambil sudah diambil user lain
router.post('/warehouse/get_items_packages', asyncHandler(authBearerMiddleware),asyncHandler(getItemsInPackage)); // Untuk melihat Posisi banyaknya Item pada resi yang ada
router.post('/warehouse/update_items_packages', asyncHandler(authBearerMiddleware),asyncHandler(updateItemsInPackage)); // Untuk mengupdate item yang sudah di kerjakan
router.get('/warehouse/get_resi_count', asyncHandler(authBearerMiddleware),asyncHandler(getCountInvoicesAvailable)); // Untuk melihat jumlah total invoices belum di kerjakan
router.get('/warehouse/get_sku_all', asyncHandler(authBearerMiddleware),asyncHandler(getAllSKUAvailable)); // Untuk melihat jumlah total barang
router.get('/warehouse/get_sku_count', asyncHandler(authBearerMiddleware),asyncHandler(getCountSKUAvailable)); // Untuk melihat jumlah total barang

//##################################### EMAIL #############
router.post('/warehouse/send_email', asyncHandler(sendingEmailTo));// Untuk cek apaka package yang di ambil sudah diambil user lain
export default router;
