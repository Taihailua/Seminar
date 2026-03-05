const express = require('express');
const { body } = require('express-validator');
const { uploadRestaurant } = require('../config/multer'); // Đã import multer config
const {
  createRestaurant,
  updateRestaurant,
  getRestaurantById,
  getAllRestaurants,
  softDeleteRestaurant
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
 * /api/restaurant/create:
 *   post:
 *     summary: Tạo nhà hàng mới (hỗ trợ upload ảnh và gán chủ sở hữu)
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
 *               - id_user
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh nhà hàng (jpeg/jpg/png, tối đa 5MB)
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
 *               id_user:                  # ← THÊM
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *                 description: ID của người dùng làm chủ nhà hàng
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu name hoặc id_user
 *       500:
 *         description: Lỗi server
 */
router.post('/create', uploadRestaurant.single('image'), createRestaurant);

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
router.put('/:id_restaurant', uploadRestaurant.single('image'), updateRestaurant);

/**
 * @swagger
 * /api/restaurant/{id_restaurant}/soft-delete:
 *   put:
 *     summary: Xóa mềm nhà hàng (đổi status thành 'deleted')
 *     tags: [Restaurant]
 *     parameters:
 *       - in: path
 *         name: id_restaurant
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của nhà hàng cần xóa mềm
 *     responses:
 *       200:
 *         description: Xóa mềm thành công
 *       400:
 *         description: Thiếu ID
 *       404:
 *         description: Không tìm thấy nhà hàng
 *       500:
 *         description: Lỗi server
 */
router.put('/:id_restaurant/soft-delete', softDeleteRestaurant);

module.exports = router;