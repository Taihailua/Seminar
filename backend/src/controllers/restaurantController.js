// controllers/restaurantController.js
const Restaurant = require('../models/restaurantModel');
const { validationResult } = require('express-validator');
const QRCode = require('qrcode');

const createRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, address, latitude, longitude } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tên nhà hàng là bắt buộc' });
    }

    let image_url = null;

    // Nếu có file ảnh upload
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/restaurants/${req.file.filename}`;
    }

    // Tạo nhà hàng mới
    const newRestaurant = await Restaurant.create({
      name,
      description: description || null,
      address: address || null,
      latitude: latitude || null,
      longitude: longitude || null,
      image_url,
    });

    const id = newRestaurant.id_restaurant;

    // Tạo QR code
    const qrData = `http://localhost:3000/api/restaurant/r/${id}`;
    const filePath = `./qrcodes/${id}.png`;
    await QRCode.toFile(filePath, qrData);

    // Update qr_code vào DB
    const updatedRestaurant = await Restaurant.update(id, {
      qr_code: qrData,
    });

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
};