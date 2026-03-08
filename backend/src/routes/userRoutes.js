// routes/userRoutes.js
const express = require('express');
const { uploadAvatar } = require('../config/multer');   
const { updateProfile, getProfile, softDeleteUser } = require('../controllers/userController');

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
 *     summary: Lấy toàn bộ thông tin profile user theo id_account
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id_account
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của account (UUID)
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
 *                     id_user:
 *                       type: string
 *                       format: uuid
 *                     id_account:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       nullable: true
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       enum: [active, inactive, banned]
 *                     language:
 *                       type: string
 *                       example: vi
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
 *     summary: Cập nhật thông tin profile (name, language và avatar)
 *     tags: [User]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id_account
 *             properties:
 *               id_account:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn Phong
 *                 nullable: true
 *               language:
 *                 type: string
 *                 enum: [vi, en]
 *                 example: vi
 *                 nullable: true
 *               avatar:
 *                 type: string
 *                 format: binary
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
 *                     id_user:
 *                       type: string
 *                       format: uuid
 *                     id_account:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       example: example@gmail.com
 *                     role:
 *                       type: string
 *                       example: user
 *                     name:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [active, inactive, banned]
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
 *         description: Thiếu id_account hoặc dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy user
 *       500:
 *         description: Lỗi server
 */
router.put('/profile', uploadAvatar.single('avatar'), updateProfile);

/**
 * @swagger
 * /api/user/{id_account}:
 *   delete:
 *     summary: Xóa mềm user (cập nhật status thành inactive)
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id_account
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của account cần xóa mềm
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Xóa mềm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id_user:
 *                       type: string
 *                       format: uuid
 *                     id_account:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: inactive
 *                     language:
 *                       type: string
 *                     token_balance:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Thiếu id_account
 *       404:
 *         description: Không tìm thấy user
 *       500:
 *         description: Lỗi server
 */
router.delete('/:id_account', softDeleteUser);

module.exports = router;