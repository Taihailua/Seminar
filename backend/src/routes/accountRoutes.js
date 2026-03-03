const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Lấy danh sách tất cả tài khoản
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: Danh sách tài khoản
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_account:
 *                     type: string
 *                   email:
 *                     type: string
 *                   created_at:
 *                     type: string
 */
router.get('/', accountController.getAccounts);

module.exports = router;