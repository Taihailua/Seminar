const express = require('express');
const { body } = require('express-validator');
const upload = require('../config/multer'); // Đã import multer config
const {
  createRestaurant,
  updateRestaurant,
  getRestaurantById,
  getAllRestaurants,
} = require('../controllers/restaurantController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Restaurant
 *   description: Quản lý nhà hàng (tạo, sửa, lấy theo ID, lấy tất cả)
 */

/**
 * @swagger
 * /api/restaurant:
 *   post:
 *     summary: Tạo nhà hàng mới (hỗ trợ upload ảnh qua field "image")
 *     tags: [Restaurant]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Chọn file ảnh nhà hàng (jpeg/jpg/png, tối đa 5MB)
 *               name:
 *                 type: string
 *                 example: Quán Phở Bò Kobe
 *               description:
 *                 type: string
 *                 example: Quán phở ngon nhất Đồng Nai
 *               address:
 *                 type: string
 *                 example: 123 Đường Nguyễn Huệ, Biên Hòa
 *               latitude:
 *                 type: number
 *                 example: 10.9574123
 *               longitude:
 *                 type: number
 *                 example: 106.8241234
 *     responses:
 *       201:
 *         description: Tạo thành công (tự động generate QR và lưu ảnh nếu có)
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc file ảnh không đúng định dạng
 *       500:
 *         description: Lỗi server
 */
router.post(
  '/',
  upload.single('image'), // ← Field name là 'image' → frontend/Postman chọn "Choose File" ở đây
  [
    body('name').trim().notEmpty().withMessage('Tên nhà hàng là bắt buộc'),
  ],
  createRestaurant
);

/**
 * @swagger
 * /api/restaurant:
 *   get:
 *     summary: Lấy danh sách tất cả nhà hàng
 *     tags: [Restaurant]
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/', getAllRestaurants);

/**
 * @swagger
 * /api/restaurant/{id_restaurant}:
 *   get:
 *     summary: Lấy chi tiết một nhà hàng theo ID
 *     tags: [Restaurant]
 *     parameters:
 *       - in: path
 *         name: id_restaurant
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Thiếu ID
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_restaurant', getRestaurantById);

/**
 * @swagger
 * /api/restaurant/{id_restaurant}:
 *   put:
 *     summary: Cập nhật thông tin nhà hàng (hỗ trợ upload ảnh mới qua field "image")
 *     tags: [Restaurant]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id_restaurant
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
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Chọn file ảnh mới (jpeg/jpg/png, nếu có)
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy nhà hàng
 *       500:
 *         description: Lỗi server
 */
router.put('/:id_restaurant', upload.single('image'), updateRestaurant);

module.exports = router;