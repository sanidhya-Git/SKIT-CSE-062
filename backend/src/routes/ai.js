'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/rbac');
const { aiLimiter } = require('../middleware/rateLimit');
const AIService = require('../services/AIService');
const { aiRequestSchema } = require('../validators/ai');

const router = Router({ mergeParams: true });

router.use(authenticate, resolveTenant);

// POST /organisations/:orgId/ai
router.post(
  '/',
  requireRole('operator'),
  aiLimiter,
  async (req, res, next) => {
    try {
      const data = aiRequestSchema.parse(req.body);
      const { action, provider, model, ...payload } = data;

      const result = await AIService.execute({
        orgId: req.params.orgId,
        runId: payload.runId || null,
        action,
        payload,
        overrideProvider: provider,
        overrideModel: model,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /organisations/:orgId/ai/usage
router.get('/usage', requireRole('admin'), async (req, res, next) => {
  try {
    const usage = await AIService.getUsage(req.params.orgId);
    res.json({ data: usage });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
