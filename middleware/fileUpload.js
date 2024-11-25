const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/images'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  allowedTypes.test(path.extname(file.originalname).toLowerCase())
    ? cb(null, true)
    : cb(new Error('Invalid file type'), false);
};

module.exports = multer({ storage, fileFilter });
