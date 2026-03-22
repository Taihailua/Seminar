// routes/restaurantAudioRoutes.js
const express = require('express');
const { getAllAudios, getAudioById } = require('../controllers/restaurantAudioController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: RestaurantAudio
 *   description: Quản lý audio của nhà hàng (giới thiệu, hướng dẫn, quảng cáo...)
 */

/**
 * @swagger
 * /api/restaurant-audio:
 *   get:
 *     summary: Lấy danh sách tất cả audio
 *     tags: [RestaurantAudio]
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
 *                 audios:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_audio:
 *                         type: string
 *                         format: uuid
 *                       language:
 *                         type: string
 *                         example: vi
 *                       audio_url:
 *                         type: string
 *                         nullable: true
 *                       script_text:
 *                         type: string
 *                         nullable: true
 *       500:
 *         description: Lỗi server
 */
router.get('/', getAllAudios);

/**
 * @swagger
 * /api/restaurant-audio/{id_audio}:
 *   get:
 *     summary: Lấy chi tiết một audio theo ID
 *     tags: [RestaurantAudio]
 *     parameters:
 *       - in: path
 *         name: id_audio
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của audio
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       400:
 *         description: Thiếu id_audio
 *       404:
 *         description: Không tìm thấy audio
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_audio', getAudioById);

module.exports = router;