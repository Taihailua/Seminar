
const MenuItem = require('../models/menuItemModel');
const { validationResult } = require('express-validator');

const createMenuItem = async (req, res) => {
  try {
    const { id_restaurant, name, description, price } = req.body;

    let image_url = null;

    // 👇 Lấy từ multer
    if (req.file) {
      image_url = `/uploads/items/${req.file.filename}`;
    }

    const newItem = await MenuItem.create({
      id_restaurant,
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
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_menu_item } = req.params;
    const { name, description, price, status } = req.body;

    if (!id_menu_item) {
      return res.status(400).json({ message: 'Thiếu id_menu_item' });
    }

    const existing = await MenuItem.findById(id_menu_item);
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    }
    let image_url;
    if (req.file) {
      image_url = `/uploads/items/${req.file.filename}`;
    }
    const updated = await MenuItem.update(id_menu_item, {
      name,
      description,
      price,
      image_url,
      status,
    });

    res.json({
      message: 'Cập nhật món ăn thành công',
      menuItem: updated,
    });
  } catch (err) {
    console.error('Lỗi cập nhật món ăn:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật món ăn' });
  }
};

const softDeleteMenuItem = async (req, res) => {
  try {
    const { id_menu_item } = req.params;

    if (!id_menu_item) {
      return res.status(400).json({ message: 'Thiếu id_menu_item' });
    }

    const existing = await MenuItem.findById(id_menu_item);
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    }

    const deletedItem = await MenuItem.softDelete(id_menu_item);

    res.json({
      message: 'Xóa mềm món ăn thành công (status = deleted)',
      menuItem: deletedItem,
    });
  } catch (err) {
    console.error('Lỗi xóa mềm món ăn:', err);
    res.status(500).json({ message: 'Lỗi server khi xóa món ăn' });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const { id_menu_item } = req.params;
    if (!id_menu_item) return res.status(400).json({ message: 'Thiếu id_menu_item' });

    const item = await MenuItem.findById(id_menu_item);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy món ăn' });

    res.json({
      message: 'Lấy thông tin món ăn thành công',
      menuItem: item,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const getAllMenuItems = async (req, res) => {
  try {
    const { id_restaurant } = req.query; // hỗ trợ lọc theo nhà hàng

    const items = await MenuItem.getAll(id_restaurant);

    res.json({
      message: 'Lấy danh sách món ăn thành công',
      count: items.length,
      menuItems: items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  createMenuItem,
  updateMenuItem,
  softDeleteMenuItem,
  getMenuItemById,
  getAllMenuItems,
};