// controllers/restaurantMenuItemController.js
const RestaurantMenuItem = require('../models/restaurantMenuItemModel');

const getAllRestaurantMenuItems = async (req, res) => {
  try {
    const menuItems = await RestaurantMenuItem.getAll();

    res.json({
      message: 'Lấy danh sách menu của các nhà hàng thành công',
      count: menuItems.length,
      data: menuItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách menu' });
  }
};

const getRestaurantMenuItemById = async (req, res) => {
  try {
    const { id_restaurant, id_menu_item } = req.params;

    if (!id_restaurant || !id_menu_item) {
      return res.status(400).json({ message: 'Thiếu id_restaurant hoặc id_menu_item' });
    }

    const menuItem = await RestaurantMenuItem.getById(id_restaurant, id_menu_item);

    if (!menuItem) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn này trong menu của nhà hàng' });
    }

    res.json({
      message: 'Lấy thông tin menu thành công',
      data: menuItem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin menu' });
  }
};

module.exports = {
  getAllRestaurantMenuItems,
  getRestaurantMenuItemById,
};