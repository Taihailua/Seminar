// controllers/restaurantAudioController.js
const RestaurantAudio = require('../models/restaurantAudioModel');

const getAllAudios = async (req, res) => {
  try {
    const audios = await RestaurantAudio.getAll();

    res.json({
      message: 'Lấy danh sách audio thành công',
      count: audios.length,
      audios,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách audio' });
  }
};

const getAudioById = async (req, res) => {
  try {
    const { id_audio } = req.params;

    if (!id_audio) {
      return res.status(400).json({ message: 'Thiếu id_audio' });
    }

    const audio = await RestaurantAudio.getById(id_audio);

    if (!audio) {
      return res.status(404).json({ message: 'Không tìm thấy audio' });
    }

    res.json({
      message: 'Lấy thông tin audio thành công',
      audio,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin audio' });
  }
};

module.exports = { getAllAudios, getAudioById };