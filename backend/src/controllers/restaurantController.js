// controllers/restaurantController.js
const Restaurant = require('../models/restaurantModel');
const { validationResult } = require('express-validator');
const QRCode = require('qrcode');
const Auth = require('../models/authModel');

const createRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, address, latitude, longitude, id_user } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tên nhà hàng là bắt buộc' });
    }

    if (!id_user) {
      return res.status(400).json({ message: 'id_user là bắt buộc khi tạo nhà hàng' });
    }

    let image_url = null;

    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/restaurants/${req.file.filename}`;
    }

    // 🔥 FIX: thêm qr_code tạm để insert không lỗi
    const newRestaurant = await Restaurant.create({
      name,
      description: description || null,
      address: address || null,
      latitude: latitude || null,
      longitude: longitude || null,
      image_url,
      id_user,
      qr_code: 'TEMP_QR', // 👈 QUAN TRỌNG
    });

    const id = newRestaurant.id_restaurant;

    // 🔥 Tạo QR thật
    const qrData = `http://${req.get('host')}/api/restaurant/r/${id}`;
    const filePath = `./qrcodes/${id}.png`;
    await QRCode.toFile(filePath, qrData);

    // 🔥 Update lại QR thật
    const updatedRestaurant = await Restaurant.updateQr(id, qrData);

    // update role
    try {
      await Auth.updateRole(id_user, 'owner');
    } catch (err) {
      console.error('Lỗi cập nhật role owner:', err);
    }

    res.status(201).json({
      message: 'Tạo nhà hàng thành công',
      restaurant: updatedRestaurant,
      qr_image: `${req.protocol}://${req.get('host')}/qrcodes/${id}.png`,
      image_url: image_url || null,
    });

  } catch (err) {
    console.error('Lỗi tạo nhà hàng:', err);
    res.status(500).json({ message: 'Lỗi server khi tạo nhà hàng' });
  }
};

const softDeleteRestaurant = async (req, res) => {
  try {
    const { id_restaurant } = req.params;

    if (!id_restaurant) {
      return res.status(400).json({ message: 'Thiếu id_restaurant' });
    }

    // Kiểm tra nhà hàng có tồn tại không
    const existing = await Restaurant.findById(id_restaurant);
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });
    }

    // Thực hiện xóa mềm
    const deletedRestaurant = await Restaurant.softDelete(id_restaurant);

    if (!deletedRestaurant) {
      return res.status(500).json({ message: 'Không thể xóa nhà hàng' });
    }

    res.json({
      message: 'Xóa mềm nhà hàng thành công (status = deleted)',
      restaurant: deletedRestaurant
    });
  } catch (err) {
    console.error('Lỗi xóa mềm nhà hàng:', err);
    res.status(500).json({ message: 'Lỗi server khi xóa nhà hàng' });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_restaurant } = req.params;
    const { name, description, address, latitude, longitude } = req.body;

    if (!id_restaurant) {
      return res.status(400).json({ message: 'Thiếu id_restaurant' });
    }

    const existing = await Restaurant.findById(id_restaurant);
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });
    }

    let image_url = existing.image_url; // Giữ nguyên nếu không upload mới

    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/restaurants/${req.file.filename}`;
    }

    const updated = await Restaurant.update(id_restaurant, {
      name: name !== undefined ? name : existing.name,
      description: description !== undefined ? description : existing.description,
      address: address !== undefined ? address : existing.address,
      latitude: latitude !== undefined ? latitude : existing.latitude,
      longitude: longitude !== undefined ? longitude : existing.longitude,
      image_url,
    });

    res.json({
      message: 'Cập nhật nhà hàng thành công',
      restaurant: updated,
    });
  } catch (err) {
    console.error('Lỗi cập nhật nhà hàng:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhà hàng' });
  }
};

const getRestaurantById = async (req, res) => {
  try {
    const { id_restaurant } = req.params;

    if (!id_restaurant) {
      return res.status(400).json({ message: 'Thiếu id_restaurant' });
    }

    const restaurant = await Restaurant.findById(id_restaurant);

    if (!restaurant) {
      return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });
    }

    const qrImageUrl = `${req.protocol}://${req.get('host')}/qrcodes/${id_restaurant}.png`;

    res.json({
      message: 'Lấy thông tin nhà hàng thành công',
      restaurant,
      qr_image: qrImageUrl,
    });
  } catch (err) {
    console.error('Lỗi lấy nhà hàng:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin nhà hàng' });
  }
};

const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.getAll();

    res.json({
      message: 'Lấy danh sách nhà hàng thành công',
      count: restaurants.length,
      restaurants,
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhà hàng' });
  }
};

module.exports = {
  createRestaurant,
  updateRestaurant,
  getRestaurantById,
  getAllRestaurants,
  softDeleteRestaurant
};