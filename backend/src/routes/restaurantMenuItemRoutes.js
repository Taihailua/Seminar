// routes/restaurantMenuItemRoutes.js
const express = require('express');
const {
  getAllRestaurantMenuItems,
  getRestaurantMenuItemById,
} = require('../controllers/restaurantMenuItemController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: RestaurantMenuItem
 *   description: Quản lý mối quan hệ nhà hàng - món ăn (menu)
 */

/**
 * @swagger
 * /api/restaurant-menu-item:
 *   get:
 *     summary: Lấy danh sách tất cả món ăn của các nhà hàng
 *     tags: [RestaurantMenuItem]
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
 *                       id_restaurant:
 *                         type: string
 *                         format: uuid
 *                       id_menu_item:
 *                         type: string
 *                         format: uuid
 *       500:
 *         description: Lỗi server
 */
router.get('/', getAllRestaurantMenuItems);

/**
 * @swagger
 * /api/restaurant-menu-item/{id_restaurant}/{id_menu_item}:
 *   get:
 *     summary: Kiểm tra / lấy thông tin món ăn trong menu của nhà hàng theo ID
 *     tags: [RestaurantMenuItem]
 *     parameters:
 *       - in: path
 *         name: id_restaurant
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của nhà hàng
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: path
 *         name: id_menu_item
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của món ăn
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Tìm thấy món ăn trong menu
 *       400:
 *         description: Thiếu tham số
 *       404:
 *         description: Không tìm thấy món ăn trong menu của nhà hàng này
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_restaurant/:id_menu_item', getRestaurantMenuItemById);

module.exports = router;