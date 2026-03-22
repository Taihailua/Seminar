// controllers/menuItemController.js
const MenuItem = require('../models/menuItemModel');
const { validationResult } = require('express-validator');

const createMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, image_url } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tên món ăn là bắt buộc' });
    }

    const newItem = await MenuItem.create({
      name,
      description,
      price,
      image_url,
    });

    res.status(201).json({
      message: 'Tạo món ăn thành công',
      menuItem: newItem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi tạo món ăn' });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_menu_item } = req.params;
    const { name, description, price, image_url } = req.body;

    if (!id_menu_item) {
      return res.status(400).json({ message: 'Thiếu id_menu_item' });
    }

    const existing = await MenuItem.findById(id_menu_item);
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    }

    const updated = await MenuItem.update(id_menu_item, {
      name,
      description,
      price,
      image_url,
    });

    res.json({
      message: 'Cập nhật món ăn thành công',
      menuItem: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật món ăn' });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const { id_menu_item } = req.params;

    if (!id_menu_item) {
      return res.status(400).json({ message: 'Thiếu id_menu_item' });
    }

    const item = await MenuItem.findById(id_menu_item);

    if (!item) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    }

    res.json({
      message: 'Lấy thông tin món ăn thành công',
      menuItem: item,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin món ăn' });
  }
};

const getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.getAll();

    res.json({
      message: 'Lấy danh sách món ăn thành công',
      count: items.length,
      menuItems: items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách món ăn' });
  }
};

module.exports = {
  createMenuItem,
  updateMenuItem,
  getMenuItemById,
  getAllMenuItems,
};