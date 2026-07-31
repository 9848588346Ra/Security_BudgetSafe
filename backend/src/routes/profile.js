const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const path = require('path');
const profile = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(requireAuth);

router.get('/', profile.getProfile);
router.patch('/', profile.updateValidators, profile.updateProfile);
router.post('/avatar', upload.single('avatar'), profile.uploadAvatar);

module.exports = router;
