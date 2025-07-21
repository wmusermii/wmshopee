import { Router } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { echo } from '../controllers/api.controller';
import { login } from '../controllers/auth.controller';
const router = Router();
router.get('/echo', echo);
//##################################### REAL FUNCTION#############
//##################################### AUTH ROUTES #############
router.post('/auth/login', login);
//##################################### AUTH ROUTES #############
export default router;
