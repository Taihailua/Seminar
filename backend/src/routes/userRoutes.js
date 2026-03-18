// routes/userRoutes.js
const express = require('express');
const { uploadAvatar } = require('../config/multer');
const { 
  updateUserInfo, 
  updateAvatar, 
  getProfile, 
  softDeleteUser 
} = require('../controllers/userController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Quản lý thông tin profile user (name, language, avatar, xóa mềm)
 */

// ===================================================================
// GET PROFILE
// ===================================================================
/**
 * @swagger
 * /api/user/profile/{id_account}:
 *   get:
 *     summary: Lấy thông tin profile user theo id_account
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
 *       400:
 *         description: Thiếu id_account
 *       404:
 *         description: Không tìm thấy profile user
 *       500:
 *         description: Lỗi server
 */
router.get('/profile/:id_account', getProfile);

// ===================================================================
// UPDATE USER INFO (Name + Language)
// ===================================================================
/**
 * @swagger
 * /api/user/profile/info:
 *   put:
 *     summary: Cập nhật thông tin cá nhân (name và language)
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
 *               name:
 *                 type: string
 *                 nullable: true
 *                 example: Nguyễn Văn Phong
 *               language:
 *                 type: string
 *                 enum: [vi, en]
 *                 example: vi
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *       400:
 *         description: Thiếu id_account hoặc không có dữ liệu cập nhật
 *       404:
 *         description: Không tìm thấy user
 *       500:
 *         description: Lỗi server
 */
router.put('/profile/info', updateUserInfo);

// ===================================================================
// UPDATE AVATAR
// ===================================================================
/**
 * @swagger
 * /api/user/profile/avatar:
 *   put:
 *     summary: Cập nhật avatar cho user
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
 *               - avatar
 *             properties:
 *               id_account:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật avatar thành công
 *       400:
 *         description: Thiếu id_account hoặc không có file avatar
 *       404:
 *         description: Không tìm thấy user
 *       500:
 *         description: Lỗi server
 */
router.put('/profile/avatar', uploadAvatar.single('avatar'), updateAvatar);

// ===================================================================
// SOFT DELETE USER
// ===================================================================
/**
 * @swagger
 * /api/user/{id_account}:
 *   delete:
 *     summary: Xóa mềm user (cập nhật status = inactive)
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
 *         description: Xóa mềm user thành công
 *       400:
 *         description: Thiếu id_account
 *       404:
 *         description: Không tìm thấy user
 *       500:
 *         description: Lỗi server
 */
router.delete('/:id_account', softDeleteUser);

module.exports = router;