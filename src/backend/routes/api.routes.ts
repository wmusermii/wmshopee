import { Router } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { checkPackageTaken, echo, generateQShopee, generateQShopeeCurrent, generateQShopeeJobs, getAllSKUAvailable, getAllSKUOnTransaction, getAllStockopname, getAllWarhouseAvailable, getBestDataToPrint, getCountInvoicesAvailable, getCountSKUAvailable, getItemsInPackage, getPackageJobAvailable, getQShopee, getQShopeeAttribute, getQShopeeToday, getShopInfo, getShopPerformance, getStockDetailopnameByIdOP, getStockDetailopnameByIdOPExcel, insertStockDetailopname, insertStockopname, sendingEmailTo, sendingPrinting, updateItemsInPackage, updateQShopeeAttribute, updateUser, viewQShopeePosItem } from '../controllers/api.controller';
import { attrb, login, registUser } from '../controllers/auth.controller';
import { authBearerMiddleware } from '../middlewares/authmiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';
const router = Router();
router.get('/echo', echo);
//##################################### REAL FUNCTION#############
router.get('/shopee/get_qshopee', asyncHandler(authBearerMiddleware),asyncHandler(getQShopee)); // untuk menggenerate table q_shopee generateQShopeeJobs
router.get('/shopee/get_qshopeetoday', asyncHandler(authBearerMiddleware),asyncHandler(getQShopeeToday)); // untuk melihat table q_shopee terakhir update per hari ini
router.post('/shopee/gen_qshopee', asyncHandler(authBearerMiddleware),asyncHandler(generateQShopee)); // untuk menggenerate table q_shopee
router.post('/shopee/gen_qshopeeCurrent', asyncHandler(authBearerMiddleware),asyncHandler(generateQShopeeCurrent)); // INI YANG POENTING
router.post('/shopee/gen_qshopee_job', asyncHandler(authBearerMiddleware),asyncHandler(generateQShopeeJobs)); // untuk menggenerate table q_shopee_invoice
router.post('/shopee/get_positem', asyncHandler(authBearerMiddleware),asyncHandler(viewQShopeePosItem)); // untuk menggenerate table q_shopee generateQShopeeJobs
router.get('/shopee/get_shop_performance', asyncHandler(authBearerMiddleware),asyncHandler(getShopPerformance)); // untuk mendapatka performa toko terhadap shopee
router.get('/shopee/get_shop_info', asyncHandler(authBearerMiddleware),asyncHandler(getShopInfo)); //mendapatkan Info toko dari Shopee
router.post('/shopee/get_data_print', asyncHandler(authBearerMiddleware),asyncHandler(getBestDataToPrint));// Untuk print label invoice
router.post('/shopee/send_print', asyncHandler(authBearerMiddleware),asyncHandler(sendingPrinting));// Untuk print label invoice

router.get('/shopee/get_attributes', asyncHandler(authBearerMiddleware),asyncHandler(getQShopeeAttribute));
router.post('/shopee/update_attributes', asyncHandler(authBearerMiddleware),asyncHandler(updateQShopeeAttribute));

//##################################### AUTH ROUTES #############
router.post('/auth/login', asyncHandler(login));
router.post('/auth/registuser', asyncHandler(registUser));
router.get('/auth/attrb',asyncHandler(authBearerMiddleware), asyncHandler(attrb));
router.post('/auth/updateuser', asyncHandler(authBearerMiddleware),asyncHandler(updateUser));
//##################################### AUTH ROUTES #############

router.get('/warehouse/get_jobs/available', asyncHandler(authBearerMiddleware),asyncHandler(viewQShopeePosItem));// Untuk mengambil Jobs / POS barang list dalam Inquery Shopee yang available
router.get('/warehouse/get_packages', asyncHandler(authBearerMiddleware),asyncHandler(getPackageJobAvailable));// Untuk mengambil Packaging list dalam Jobs yang available
router.post('/warehouse/check_taken_packages', asyncHandler(authBearerMiddleware),asyncHandler(checkPackageTaken));// Untuk cek apaka package yang di ambil sudah diambil user lain
router.post('/warehouse/get_items_packages', asyncHandler(authBearerMiddleware),asyncHandler(getItemsInPackage)); // Untuk melihat Posisi banyaknya Item pada resi yang ada
router.post('/warehouse/update_items_packages', asyncHandler(authBearerMiddleware),asyncHandler(updateItemsInPackage)); // Untuk mengupdate item yang sudah di kerjakan
router.get('/warehouse/get_resi_count', asyncHandler(authBearerMiddleware),asyncHandler(getCountInvoicesAvailable)); // Untuk melihat jumlah total invoices belum di kerjakan
router.get('/warehouse/get_sku_all', asyncHandler(authBearerMiddleware),asyncHandler(getAllSKUAvailable)); // Untuk melihat barang yang ada di stocks
router.get('/warehouse/get_sku_count', asyncHandler(authBearerMiddleware),asyncHandler(getCountSKUAvailable)); // Untuk melihat jumlah total barang
router.get('/warehouse/get_warehouse_all', asyncHandler(authBearerMiddleware),asyncHandler(getAllWarhouseAvailable)); // Untuk melihat warehouse yang ada

router.get('/warehouse/get_stockopname_all', asyncHandler(authBearerMiddleware),asyncHandler(getAllStockopname)); // Untuk melihat keseluruhan stock opname yang ada
router.post('/warehouse/insert_stockopname', asyncHandler(authBearerMiddleware),asyncHandler(insertStockopname));
router.post('/warehouse/update_stockopname', asyncHandler(authBearerMiddleware),asyncHandler(insertStockopname));
router.post('/warehouse/delete_stockopname', asyncHandler(authBearerMiddleware),asyncHandler(insertStockopname));
router.get('/warehouse/get_stocks_so', asyncHandler(authBearerMiddleware),asyncHandler(getAllSKUOnTransaction)); // Untuk melihat barang yang ada selama transaksi
router.post('/warehouse/get_stockopnamedetail', asyncHandler(authBearerMiddleware),asyncHandler(getStockDetailopnameByIdOP));
router.post('/warehouse/get_stockopnamedetailExport', asyncHandler(authBearerMiddleware),asyncHandler(getStockDetailopnameByIdOPExcel));
router.post('/warehouse/insert_stockopnamedetail', asyncHandler(authBearerMiddleware),asyncHandler(insertStockDetailopname));

//##################################### EMAIL #############
router.post('/warehouse/send_email', asyncHandler(sendingEmailTo));// Untuk cek apaka package yang di ambil sudah diambil user lain
//##################################### Printing #############

export default router;
