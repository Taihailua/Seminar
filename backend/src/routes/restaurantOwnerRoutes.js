// routes/restaurantOwnerRoutes.js
const express = require('express');
const {
  getAllRestaurantOwners,
  getRestaurantOwnerById,
} = require('../controllers/restaurantOwnerController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: RestaurantOwner
 *   description: Quản lý mối quan hệ chủ sở hữu - nhà hàng
 */

/**
 * @swagger
 * /api/restaurant-owner:
 *   get:
 *     summary: Lấy danh sách tất cả chủ nhà hàng
 *     tags: [RestaurantOwner]
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_user:
 *                         type: string
 *                         format: uuid
 *                       id_restaurant:
 *                         type: string
 *                         format: uuid
 *       500:
 *         description: Lỗi server
 */
router.get('/', getAllRestaurantOwners);

/**
 * @swagger
 * /api/restaurant-owner/{id_user}/{id_restaurant}:
 *   get:
 *     summary: Lấy thông tin mối quan hệ chủ - nhà hàng theo ID
 *     tags: [RestaurantOwner]
 *     parameters:
 *       - in: path
 *         name: id_user
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của user (chủ sở hữu)
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: path
 *         name: id_restaurant
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của nhà hàng
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       400:
 *         description: Thiếu tham số
 *       404:
 *         description: Không tìm thấy mối quan hệ này
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_user/:id_restaurant', getRestaurantOwnerById);

module.exports = router;