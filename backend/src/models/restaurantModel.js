// models/restaurantModel.js
const pool = require('../config/db');

const Restaurant = {
  // Tạo mới nhà hàng (thêm image_url)
  create: async ({ name, description, address, latitude, longitude, image_url, id_user, qr_code }) => {
    const result = await pool.query(
      `INSERT INTO restaurants (name, description, address, latitude, longitude, image_url, qr_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_restaurant, name, description, address, latitude, longitude, qr_code, image_url, created_at`,
      [name, description || null, address || null, latitude || null, longitude || null, image_url || null, qr_code]
    );

    const newRestaurant = result.rows[0];

    // owner
    if (id_user) {
      await pool.query(
        `INSERT INTO restaurant_owners (id_user, id_restaurant)
        VALUES ($1, $2)
        ON CONFLICT (id_user, id_restaurant) DO NOTHING`,
        [id_user, newRestaurant.id_restaurant]
      );
    }

    return newRestaurant;
  },

  // Tìm theo qr_code
  findByQrCode: async (qr_code) => {
    const result = await pool.query(
      'SELECT * FROM restaurants WHERE qr_code = $1',
      [qr_code]
    );
    return result.rows[0] || null;
  },

  // Tìm theo id_restaurant (thêm image_url)
  findById: async (id_restaurant) => {
    const result = await pool.query(
      'SELECT id_restaurant, name, description, address, latitude, longitude, qr_code, image_url, created_at, status FROM restaurants WHERE id_restaurant = $1',
      [id_restaurant]
    );
    return result.rows[0] || null;
  },

  updateQr: async (id_restaurant, qr_code) => {
    const result = await pool.query(
      `UPDATE restaurants
      SET qr_code = $1
      WHERE id_restaurant = $2
      RETURNING id_restaurant, name, description, address, latitude, longitude, qr_code, image_url, created_at`,
      [qr_code, id_restaurant]
    );

    return result.rows[0] || null;
  },

  // Lấy tất cả nhà hàng (thêm image_url)
  getAll: async () => {
    const result = await pool.query(
      `SELECT id_restaurant, name, description, address, latitude, longitude, qr_code, image_url, created_at 
       FROM restaurants 
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  // Cập nhật thông tin (thêm image_url)
  update: async (id_restaurant, { name, description, address, latitude, longitude, qr_code, image_url }) => {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (address !== undefined) {
      updates.push(`address = $${paramIndex}`);
      values.push(address);
      paramIndex++;
    }

    if (latitude !== undefined) {
      updates.push(`latitude = $${paramIndex}`);
      values.push(latitude);
      paramIndex++;
    }

    if (longitude !== undefined) {
      updates.push(`longitude = $${paramIndex}`);
      values.push(longitude);
      paramIndex++;
    }

    if (qr_code !== undefined) {
      updates.push(`qr_code = $${paramIndex}`);
      values.push(qr_code);
      paramIndex++;
    }

    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex}`);
      values.push(image_url);
      paramIndex++;
    }

    if (updates.length === 0) {
      return await Restaurant.findById(id_restaurant);
    }

    values.push(id_restaurant);

    const query = `
      UPDATE restaurants
      SET ${updates.join(', ')}
      WHERE id_restaurant = $${paramIndex}
      RETURNING id_restaurant, name, description, address, latitude, longitude, qr_code, image_url, created_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  // Xóa (giữ nguyên)
  delete: async (id_restaurant) => {
    const result = await pool.query(
      'DELETE FROM restaurants WHERE id_restaurant = $1 RETURNING id_restaurant',
      [id_restaurant]
    );
    return result.rowCount > 0;
  },

  softDelete: async (id_restaurant) => {
    const result = await pool.query(
      `UPDATE restaurants 
       SET status = 'deleted' 
       WHERE id_restaurant = $1 
       RETURNING id_restaurant, name, status`,
      [id_restaurant]
    );

    return result.rows[0] || null;
  },
};


module.exports = Restaurant;