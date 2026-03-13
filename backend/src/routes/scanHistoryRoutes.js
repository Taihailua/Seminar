const express = require('express');
const {
  getAllScanHistories,
  getScanHistoryById,
  getScanHistoryByUser,
  createScanHistory
} = require('../controllers/scanHistoryController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ScanHistory
 *   description: Lịch sử quét mã QR / check-in nhà hàng
 */

/**
 * @swagger
 * /api/scan-history:
 *   get:
 *     summary: Lấy toàn bộ lịch sử quét (admin)
 *     tags: [ScanHistory]
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/', getAllScanHistories);

/**
 * @swagger
 * /api/scan-history/user/{id_user}:
 *   get:
 *     summary: Lấy danh sách lịch sử quét của một user
 *     tags: [ScanHistory]
 *     parameters:
 *       - in: path
 *         name: id_user
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bản ghi tối đa (default 50)
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Thiếu id_user
 *       500:
 *         description: Lỗi server
 */
router.get('/user/:id_user', getScanHistoryByUser);

/**
 * @swagger
 * /api/scan-history/{id_user}/{id_restaurant}:
 *   get:
 *     summary: Kiểm tra / lấy thông tin quét cụ thể của user tại 1 nhà hàng
 *     tags: [ScanHistory]
 *     parameters:
 *       - in: path
 *         name: id_user
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id_restaurant
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tìm thấy bản ghi
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get('/:id_user/:id_restaurant', getScanHistoryById);

/**
 * @swagger
 * /api/scan-history:
 *   post:
 *     summary: Tạo mới hoặc cập nhật lịch sử quét (upsert)
 *     tags: [ScanHistory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_user
 *               - id_restaurant
 *             properties:
 *               id_user:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               id_restaurant:
 *                 type: string
 *                 format: uuid
 *                 example: "987fcdeb-51a2-43e8-9b12-3456789abcde"
 *               token_used:
 *                 type: integer
 *                 default: 50
 *                 description: Số token sử dụng (mặc định 50)
 *     responses:
 *       201:
 *         description: Tạo/cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/', createScanHistory);


module.exports = router;