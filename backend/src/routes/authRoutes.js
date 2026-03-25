// routes/authRoutes.js
const express = require('express');
const { uploadAvatar } = require('../config/multer');   
const { register, login, updateRole } = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản (có upload avatar)
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - language
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *               language:
 *                 type: string
 */
router.post('/register', uploadAvatar.single('avatar'), register);

router.post('/login', login);

/**
 * @swagger
 * /api/auth/role/{id_account}:
 *   put:
 *     summary: Cập nhật role cho tài khoản (chỉ admin/owner mới dùng được)
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_account
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của account cần cập nhật role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, owner]
 *                 description: Role mới cần cập nhật
 *     responses:
 *       200:
 *         description: Cập nhật role thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 account:
 *                   type: object
 *       400:
 *         description: Role không hợp lệ hoặc thiếu thông tin
 *       404:
 *         description: Không tìm thấy account
 *       500:
 *         description: Lỗi server
 */
router.put('/role/:id_account', updateRole);

module.exports = router;