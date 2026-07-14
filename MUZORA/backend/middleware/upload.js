const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const songStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'audio') {
      return {
        folder: 'muzora/audio',
        resource_type: 'video',
      };
    } else {
      return {
        folder: 'muzora/covers',
        resource_type: 'image',
        transformation: [{ width: 500, height: 500, crop: 'fill' }],
      };
    }
  },
});

const artistStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'muzora/artists',
    resource_type: 'image',
    transformation: [{ width: 800, height: 800, crop: 'fill' }],
  }),
});

const uploadSongFiles = multer({
  storage: songStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

const uploadArtistImage = multer({
  storage: artistStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');

module.exports = { uploadSongFiles, uploadArtistImage };