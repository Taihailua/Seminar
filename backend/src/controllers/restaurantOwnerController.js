// controllers/restaurantOwnerController.js
const RestaurantOwner = require('../models/restaurantOwnerModel');

const getAllRestaurantOwners = async (req, res) => {
  try {
    const owners = await RestaurantOwner.getAll();

    res.json({
      message: 'Lấy danh sách chủ nhà hàng thành công',
      count: owners.length,
      data: owners,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách chủ nhà hàng' });
  }
};

const getRestaurantOwnerById = async (req, res) => {
  try {
    const { id_user, id_restaurant } = req.params;

    if (!id_user || !id_restaurant) {
      return res.status(400).json({ message: 'Thiếu id_user hoặc id_restaurant' });
    }

    const owner = await RestaurantOwner.getById(id_user, id_restaurant);

    if (!owner) {
      return res.status(404).json({ message: 'Không tìm thấy mối quan hệ chủ - nhà hàng này' });
    }

    res.json({
      message: 'Lấy thông tin chủ nhà hàng thành công',
      data: owner,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin chủ nhà hàng' });
  }
};

module.exports = {
  getAllRestaurantOwners,
  getRestaurantOwnerById,
};