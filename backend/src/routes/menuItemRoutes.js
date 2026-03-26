// routes/menuItemRoutes.js
const express = require('express');
const { uploadMenuItem } = require('../config/multer');

const {
  createMenuItem,
  updateMenuItem,
  softDeleteMenuItem,
  getMenuItemById,
  getAllMenuItems,
} = require('../controllers/menuItemController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MenuItem
 *   description: Quản lý món ăn của nhà hàng (Menu Item)
 */

/**
 * @swagger
 * /api/menu-items:
 *   post:
 *     summary: Tạo món ăn mới (hỗ trợ upload ảnh)
 *     tags: [MenuItem]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id_restaurant
 *               - name
 *             properties:
 *               id_restaurant:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh món ăn (jpeg/jpg/png, tối đa 5MB)
 *     responses:
 *       201:
 *         description: Tạo món ăn thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post(
  '/',
  uploadMenuItem.single('image'),
  createMenuItem
);

/**
 * @swagger
 * /api/menu-items:
 *   get:
 *     summary: Lấy danh sách tất cả món ăn
 *     tags: [MenuItem]
 *     parameters:
 *       - in: query
 *         name: id_restaurant
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo nhà hàng
 *     responses:
 *       200:
 *         description: Lấy danh sách món ăn thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/', getAllMenuItems);

/**
 * @swagger
 * /api/menu-items/{id_menu_item}:
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
 *     responses:
 *       200:
 *         description: Lấy thông tin món ăn thành công
 *       400:
 *         description: Thiếu id_menu_item
 *       404:
 *         description: Không tìm thấy món ăn
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_menu_item', getMenuItemById);

/**
 * @swagger
 * /api/menu-items/{id_menu_item}:
 *   put:
 *     summary: Cập nhật món ăn (hỗ trợ thay ảnh)
 *     tags: [MenuItem]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id_menu_item
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               image:
 *                 type: string
 *                 format: binary
 *               status:
 *                 type: string
 *                 enum: [available, unavailable, deleted]
 *     responses:
 *       200:
 *         description: Cập nhật món ăn thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc thiếu id
 *       404:
 *         description: Không tìm thấy món ăn
 *       500:
 *         description: Lỗi server
 */
router.put(
  '/:id_menu_item',
  uploadMenuItem.single('image'),
  updateMenuItem
);

/**
 * @swagger
 * /api/menu-items/{id_menu_item}/soft-delete:
 *   put:
 *     summary: Xóa mềm món ăn
 *     tags: [MenuItem]
 *     parameters:
 *       - in: path
 *         name: id_menu_item
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Xóa mềm món ăn thành công
 *       400:
 *         description: Thiếu id_menu_item
 *       404:
 *         description: Không tìm thấy món ăn
 *       500:
 *         description: Lỗi server
 */
router.put('/:id_menu_item/soft-delete', softDeleteMenuItem);

module.exports = router;