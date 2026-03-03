const RestaurantAudioMap = require('../models/restaurantAudioMapModel');

const getAllRestaurantAudios = async (req, res) => {
  try {
    const mappings = await RestaurantAudioMap.getAll();

    res.json({
      message: 'Lấy danh sách mapping nhà hàng - audio thành công',
      count: mappings.length,
      data: mappings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách mapping audio' });
  }
};

const getRestaurantAudioById = async (req, res) => {
  try {
    const { id_restaurant, id_audio } = req.params;

    if (!id_restaurant || !id_audio) {
      return res.status(400).json({ message: 'Thiếu id_restaurant hoặc id_audio' });
    }

    const mapping = await RestaurantAudioMap.getById(id_restaurant, id_audio);

    if (!mapping) {
      return res.status(404).json({ 
        message: 'Không tìm thấy audio này trong danh sách của nhà hàng' 
      });
    }

    res.json({
      message: 'Lấy thông tin mapping nhà hàng - audio thành công',
      data: mapping,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin mapping audio' });
  }
};

module.exports = {
  getAllRestaurantAudios,
  getRestaurantAudioById,
};