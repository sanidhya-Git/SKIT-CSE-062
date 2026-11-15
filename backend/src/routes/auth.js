'use strict';

const { Router } = require('express');
const AuthService = require('../services/AuthService');
const { registerSchema, loginSchema, refreshSchema, logoutSchema } = require('../validators/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = Router();

router.use(authLimiter);

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await AuthService.refresh(refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = logoutSchema.parse(req.body);
    await AuthService.logout(refreshToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
