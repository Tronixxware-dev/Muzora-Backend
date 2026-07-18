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

const albumStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'muzora/albums',
    resource_type: 'image',
    transformation: [{ width: 500, height: 500, crop: 'fill' }],
  }),
});

const uploadSongFiles = multer({
  storage: songStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

// Used for PATCH /songs/:id — only lets you replace the cover, not the audio
const uploadSongCover = multer({
  storage: songStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('cover');

const uploadArtistImage = multer({
  storage: artistStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');

const uploadAlbumCover = multer({
  storage: albumStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('cover');

module.exports = {
  uploadSongFiles,
  uploadSongCover,
  uploadArtistImage,
  uploadAlbumCover,
};