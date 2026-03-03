// routes/userRoutes.js
const express = require('express');
const { updateProfile, getProfile } = require('../controllers/userController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Quản lý thông tin profile user (name, language, token_balance)
 */

/**
 * @swagger
 * /api/user/profile/{id_account}:
 *   get:
 *     summary: Lấy thông tin profile của user theo id_account
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id_account
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của account (từ bảng accounts), ví dụ UUID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Lấy thông tin profile thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       nullable: true
 *                     language:
 *                       type: string
 *                       enum: [vi, en]
 *                     token_balance:
 *                       type: integer
 *                       example: 999
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: id_account thiếu hoặc không hợp lệ
 *       404:
 *         description: Không tìm thấy profile user
 *       500:
 *         description: Lỗi server
 */
router.get('/profile/:id_account', getProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Cập nhật thông tin profile (name và/hoặc language)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_account
 *             properties:
 *               id_account:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *                 description: ID của account cần cập nhật (bắt buộc)
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn Phong
 *                 nullable: true
 *                 description: Tên hiển thị mới (gửi null hoặc bỏ qua nếu không muốn thay đổi)
 *               language:
 *                 type: string
 *                 enum: [vi, en]
 *                 example: vi
 *                 nullable: true
 *                 description: Ngôn ngữ mới (vi hoặc en). Nếu sai giá trị sẽ báo lỗi 400
 *     responses:
 *       200:
 *         description: Cập nhật profile thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật thông tin thành công
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     language:
 *                       type: string
 *                       enum: [vi, en]
 *                     token_balance:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Thiếu id_account, language không hợp lệ, hoặc không có dữ liệu cần cập nhật
 *       404:
 *         description: Không tìm thấy profile user với id_account này
 *       500:
 *         description: Lỗi server khi cập nhật
 */
router.put('/profile', updateProfile);

module.exports = router;