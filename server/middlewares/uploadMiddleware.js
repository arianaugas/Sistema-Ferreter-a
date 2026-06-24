
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const storage = multer.memoryStorage();
const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function uploadImage(req, res, next) {

upload.single('imagen_principal')(req, res, err => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'Error al procesar el archivo.' });
    }
    if (!req.file) {
      req.fileUrl = null;
      return next();
    }
    if (!MIME_PERMITIDOS.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Solo se permiten imágenes JPG, PNG, WEBP o GIF.' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'productos' },
      (cloudErr, result) => {
        if (cloudErr) {
          console.error('Cloudinary upload error:', cloudErr);
          return res.status(500).json({ error: 'Error al subir la imagen a Cloudinary.' });
        }

        req.fileUrl = result.secure_url;
        next();
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  });
}

module.exports = {
  uploadImage,
};
