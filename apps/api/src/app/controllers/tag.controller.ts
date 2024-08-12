import { NextFunction, Request, Response, Router } from 'express';
import auth from '../utils/auth';
import getTags from '../services/tag.service';
import * as apiCache from 'apicache';

const cache = apiCache.middleware;
const router = Router();

/**
 * Get top 10 popular tags
 * @auth optional
 * @route {GET} /api/tags
 * @returns tags list of tag names
 */
router.get('/tags', cache('1 day'), auth.optional, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await getTags(req.auth?.user?.id);
    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

export default router;
