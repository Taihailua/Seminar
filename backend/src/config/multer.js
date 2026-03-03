// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base upload folder
const UPLOAD_BASE = 'uploads';

// Tạo các thư mục con nếu chưa có
const createUploadDirs = () => {
  const dirs = [
    path.join(UPLOAD_BASE, 'avatars'),
    path.join(UPLOAD_BASE, 'restaurants')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Đã tạo folder: ${dir}`);
    }
  });
};

createUploadDirs();

// Config chung cho avatar
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_BASE, 'avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const restaurantStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_BASE, 'restaurants'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận file ảnh jpeg/jpg/png'));
};

const upload = multer({
  storage: avatarStorage,        // mặc định là avatar
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// Export nhiều instance để dùng linh hoạt
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const uploadRestaurant = multer({
  storage: restaurantStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

module.exports = {
  upload,           // mặc định
  uploadAvatar,
  uploadRestaurant
};