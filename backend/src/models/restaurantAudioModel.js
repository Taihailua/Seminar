// models/restaurantAudioModel.js
const pool = require('../config/db');

const RestaurantAudio = {
  // Lấy tất cả audio (có thể sắp xếp theo language hoặc id nếu cần)
  getAll: async () => {
    const result = await pool.query(
      `SELECT id_audio, language, audio_url, script_text
       FROM restaurant_audios
       ORDER BY language ASC, id_audio DESC`
    );
    return result.rows;
  },

  // Lấy audio theo id_audio
  getById: async (id_audio) => {
    const result = await pool.query(
      'SELECT id_audio, language, audio_url, script_text FROM restaurant_audios WHERE id_audio = $1',
      [id_audio]
    );
    return result.rows[0] || null;
  },

  // (Tùy chọn - nếu sau này cần) Tạo mới audio
  create: async ({ language, audio_url, script_text }) => {
    const result = await pool.query(
      `INSERT INTO restaurant_audios (language, audio_url, script_text)
       VALUES ($1, $2, $3)
       RETURNING id_audio, language, audio_url, script_text`,
      [language, audio_url || null, script_text || null]
    );
    return result.rows[0];
  },

  // (Tùy chọn) Cập nhật audio
  update: async (id_audio, { language, audio_url, script_text }) => {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (language !== undefined) {
      updates.push(`language = $${paramIndex}`);
      values.push(language);
      paramIndex++;
    }

    if (audio_url !== undefined) {
      updates.push(`audio_url = $${paramIndex}`);
      values.push(audio_url);
      paramIndex++;
    }

    if (script_text !== undefined) {
      updates.push(`script_text = $${paramIndex}`);
      values.push(script_text);
      paramIndex++;
    }

    if (updates.length === 0) {
      return await RestaurantAudio.getById(id_audio);
    }

    values.push(id_audio);

    const query = `
      UPDATE restaurant_audios
      SET ${updates.join(', ')}
      WHERE id_audio = $${paramIndex}
      RETURNING id_audio, language, audio_url, script_text
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
};

module.exports = RestaurantAudio;