// routes/menuItemRoutes.js
const express = require('express');
const { body } = require('express-validator');
const {
  createMenuItem,
  updateMenuItem,
  getMenuItemById,
  getAllMenuItems,
} = require('../controllers/menuItemController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MenuItem
 *   description: Quản lý món ăn trong thực đơn
 */

/**
 * @swagger
 * /api/menu-item:
 *   post:
 *     summary: Tạo món ăn mới
 *     tags: [MenuItem]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Phở Bò Tái
 *               description:
 *                 type: string
 *                 example: Phở bò tái ngon, nước dùng đậm đà
 *                 nullable: true
 *               price:
 *                 type: number
 *                 format: decimal
 *                 example: 85000.00
 *                 nullable: true
 *               image_url:
 *                 type: string
 *                 example: https://example.com/images/pho-bo-tai.jpg
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Tên món ăn là bắt buộc'),
  ],
  createMenuItem
);

/**
 * @swagger
 * /api/menu-item:
 *   get:
 *     summary: Lấy danh sách tất cả món ăn
 *     tags: [MenuItem]
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/', getAllMenuItems);

/**
 * @swagger
 * /api/menu-item/{id_menu_item}:
 *   get:
 *     summary: Lấy chi tiết một món ăn theo ID
 *     tags: [MenuItem]
 *     parameters:
 *       - in: path
 *         name: id_menu_item
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID món ăn
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Thiếu ID
 *       404:
 *         description: Không tìm thấy món ăn
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_menu_item', getMenuItemById);

/**
 * @swagger
 * /api/menu-item/{id_menu_item}:
 *   put:
 *     summary: Cập nhật thông tin món ăn
 *     tags: [MenuItem]
 *     parameters:
 *       - in: path
 *         name: id_menu_item
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
 *               name:
 *                 type: string
 *                 nullable: true
 *               description:
 *                 type: string
 *                 nullable: true
 *               price:
 *                 type: number
 *                 format: decimal
 *                 nullable: true
 *               image_url:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy món ăn
 *       500:
 *         description: Lỗi server
 */
router.put(
  '/:id_menu_item',
  [],
  updateMenuItem
);

module.exports = router;