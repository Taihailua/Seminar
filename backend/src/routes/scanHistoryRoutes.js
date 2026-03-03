const express = require('express');
const {
  getAllScanHistories,
  getScanHistoryById,
  getScanHistoryByUser,
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

module.exports = router;