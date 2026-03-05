const express = require('express');
const {
  getMapping,
  updateIsActive,
  getScriptsByRestaurant
} = require('../controllers/restaurantScriptMapController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: RestaurantScriptMap
 *   description: Quản lý mapping giữa nhà hàng và script
 */

/**
 * @swagger
 * /api/restaurant-script-map/{id_restaurant}:
 *   get:
 *     summary: Lấy tất cả script của một nhà hàng
 *     tags: [RestaurantScriptMap]
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
 *         description: Thiếu id_restaurant
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_restaurant', getScriptsByRestaurant);

/**
 * @swagger
 * /api/restaurant-script-map/{id_restaurant}/{id_script}:
 *   get:
 *     summary: Lấy chi tiết mapping theo id_restaurant và id_script
 *     tags: [RestaurantScriptMap]
 *     parameters:
 *       - in: path
 *         name: id_restaurant
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Không tìm thấy mapping
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_restaurant/:id_script', getMapping);

/**
 * @swagger
 * /api/restaurant-script-map/{id_restaurant}/{id_script}/is-active:
 *   put:
 *     summary: Cập nhật is_active của script cho nhà hàng
 *     tags: [RestaurantScriptMap]
 *     parameters:
 *       - in: path
 *         name: id_restaurant
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: is_active phải là boolean
 *       404:
 *         description: Không tìm thấy mapping
 *       500:
 *         description: Lỗi server
 */
router.put('/:id_restaurant/:id_script/is-active', updateIsActive);

module.exports = router;