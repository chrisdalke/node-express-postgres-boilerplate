import { healthcheck } from '../controllers/healthcheck.controller';
import { catchAsync } from '@fullhex/utils-js';
import { Router } from 'express';

const router = Router();

router.get('/v1/healthcheck', catchAsync(healthcheck));

export default router;
