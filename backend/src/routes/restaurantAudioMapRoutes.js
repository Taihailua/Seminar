const express = require('express');
const {
  getAllRestaurantAudios,
  getRestaurantAudioById,
} = require('../controllers/restaurantAudioMapController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: RestaurantAudioMap
 *   description: Quản lý mối quan hệ nhà hàng - audio (bản đồ âm thanh)
 */

/**
 * @swagger
 * /api/restaurant-audio-map:
 *   get:
 *     summary: Lấy danh sách tất cả mapping nhà hàng - audio
 *     tags: [RestaurantAudioMap]
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
 *                       id_audio:
 *                         type: string
 *                         format: uuid
 *       500:
 *         description: Lỗi server
 */
router.get('/', getAllRestaurantAudios);

/**
 * @swagger
 * /api/restaurant-audio-map/{id_restaurant}/{id_audio}:
 *   get:
 *     summary: Kiểm tra / lấy thông tin audio của nhà hàng theo ID
 *     tags: [RestaurantAudioMap]
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
 *         name: id_audio
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của file audio
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Tìm thấy mapping audio của nhà hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_restaurant:
 *                       type: string
 *                       format: uuid
 *                     id_audio:
 *                       type: string
 *                       format: uuid
 *       400:
 *         description: Thiếu tham số
 *       404:
 *         description: Không tìm thấy audio trong danh sách của nhà hàng này
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_restaurant/:id_audio', getRestaurantAudioById);

module.exports = router;