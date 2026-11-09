// Caricamento foto: compressione lato server (le foto del telefono pesano 3-8 MB).
const multer = require('multer');
const sharp = require('sharp');
const { one } = require('./db');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 80 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

async function savePhoto(buffer, { boatId, cleaningId = null, anodeId = null, fase = 'prima' }) {
  const img = sharp(buffer, { failOn: 'none' }).rotate(); // rispetta l'orientamento EXIF
  const big = await img.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
  const thumb = await img.clone().resize({ width: 480, height: 480, fit: 'cover' }).webp({ quality: 70 }).toBuffer();
  return one(
    'INSERT INTO photos(boat_id, cleaning_id, anode_id, data, thumb, width, height, fase) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    [boatId, cleaningId, anodeId, big.data, thumb, big.info.width, big.info.height, fase === 'dopo' ? 'dopo' : 'prima']
  );
}

async function saveMany(files, ref) {
  let n = 0;
  for (const f of files || []) {
    try { await savePhoto(f.buffer, ref); n++; } catch (e) { console.error('Foto scartata:', e.message); }
  }
  return n;
}

function sendPhoto(res, row, which) {
  res.set('Content-Type', 'image/webp');
  res.set('Cache-Control', 'private, max-age=604800');
  res.send(which === 'thumb' ? row.thumb : row.data);
}

module.exports = { upload, savePhoto, saveMany, sendPhoto };
