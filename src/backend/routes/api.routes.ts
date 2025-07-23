import { Router } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { echo } from '../controllers/api.controller';
import { attrb, login } from '../controllers/auth.controller';
import { authBearerMiddleware } from '../middlewares/authmiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';
const router = Router();
router.get('/echo', echo);
//##################################### REAL FUNCTION#############
//##################################### AUTH ROUTES #############
router.post('/auth/login', asyncHandler(login));
router.get('/auth/attrb',asyncHandler(authBearerMiddleware), asyncHandler(attrb));
//##################################### AUTH ROUTES #############
export default router;
