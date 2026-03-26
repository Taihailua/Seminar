// routes/scriptRoutes.js
const express = require('express');
const { body } = require('express-validator');
const {
  createScript,
  updateScript,
  softDeleteScript,
  getAllScripts,
  getScriptById
} = require('../controllers/scriptController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Script
 *   description: Quản lý script văn bản (cho audio, giới thiệu nhà hàng...)
 */

/**
 * @swagger
 * /api/scripts:
 *   post:
 *     summary: Tạo script mới và liên kết với nhà hàng
 *     tags: [Script]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - id_restaurant
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Chào mừng quý khách đến với nhà hàng Phở Bò Kobe..."
 *               id_restaurant:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       201:
 *         description: Tạo script thành công
 *       400:
 *         description: Thiếu content hoặc id_restaurant
 *       500:
 *         description: Lỗi server
 */
router.post(
  '/',
  [
    body('content').trim().notEmpty().withMessage('Nội dung script là bắt buộc'),
    body('id_restaurant').notEmpty().withMessage('id_restaurant là bắt buộc')
  ],
  createScript
);

/**
 * @swagger
 * /api/scripts:
 *   get:
 *     summary: Lấy danh sách tất cả script (chưa bị xóa)
 *     tags: [Script]
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/', getAllScripts);

/**
 * @swagger
 * /api/scripts/{id_script}:
 *   get:
 *     summary: Lấy chi tiết một script theo ID
 *     tags: [Script]
 *     parameters:
 *       - in: path
 *         name: id_script
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy script
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_script', getScriptById);

/**
 * @swagger
 * /api/scripts/{id_script}:
 *   put:
 *     summary: Cập nhật nội dung script
 *     tags: [Script]
 *     parameters:
 *       - in: path
 *         name: id_script
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Nội dung script đã được cập nhật..."
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy script
 *       500:
 *         description: Lỗi server
 */
router.put(
  '/:id_script',
  [body('content').trim().notEmpty().withMessage('Nội dung script là bắt buộc')],
  updateScript
);

/**
 * @swagger
 * /api/scripts/{id_script}/soft-delete:
 *   put:
 *     summary: Xóa mềm script (đổi status thành 'deleted')
 *     tags: [Script]
 *     parameters:
 *       - in: path
 *         name: id_script
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Xóa mềm thành công
 *       404:
 *         description: Không tìm thấy script
 *       500:
 *         description: Lỗi server
 */
router.put('/:id_script/soft-delete', softDeleteScript);

module.exports = router;