const RestaurantScriptMap = require('../models/restaurantScriptMapModel');

const getMapping = async (req, res) => {
  try {
    const { id_restaurant, id_script } = req.params;

    if (!id_restaurant || !id_script) {
      return res.status(400).json({ message: 'Thiếu id_restaurant hoặc id_script' });
    }

    const mapping = await RestaurantScriptMap.getByRestaurantAndScript(id_restaurant, id_script);

    if (!mapping) {
      return res.status(404).json({ message: 'Không tìm thấy mapping giữa nhà hàng và script' });
    }

    res.json({
      message: 'Lấy thông tin mapping thành công',
      mapping
    });
  } catch (err) {
    console.error('Lỗi lấy mapping:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy mapping' });
  }
};

const updateIsActive = async (req, res) => {
  try {
    const { id_restaurant, id_script } = req.params;
    const { is_active } = req.body;

    if (!id_restaurant || !id_script) {
      return res.status(400).json({ message: 'Thiếu id_restaurant hoặc id_script' });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active phải là true hoặc false' });
    }

    const updated = await RestaurantScriptMap.updateIsActive(id_restaurant, id_script, is_active);

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy mapping' });
    }

    res.json({
      message: `Cập nhật is_active thành ${is_active} thành công`,
      mapping: updated
    });
  } catch (err) {
    console.error('Lỗi cập nhật is_active:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật is_active' });
  }
};

// Lấy tất cả script của một nhà hàng
const getScriptsByRestaurant = async (req, res) => {
  try {
    const { id_restaurant } = req.params;

    if (!id_restaurant) {
      return res.status(400).json({ message: 'Thiếu id_restaurant' });
    }

    const scripts = await RestaurantScriptMap.getScriptsByRestaurant(id_restaurant);

    res.json({
      message: 'Lấy danh sách script của nhà hàng thành công',
      count: scripts.length,
      scripts
    });
  } catch (err) {
    console.error('Lỗi lấy script theo nhà hàng:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getMapping,
  updateIsActive,
  getScriptsByRestaurant
};