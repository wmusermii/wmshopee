import { Router } from 'express';
import apiRoutes from './routes/api.routes';
// import authRoutes from './routes/auth.routes'
const router = Router();
// Prefix all routes with /api
router.use('/api/', apiRoutes);
// ##### API for browser fetch #########
// router.use('/auth', authRoutes);
// router.use('/product', authRoutes);
export default router;
