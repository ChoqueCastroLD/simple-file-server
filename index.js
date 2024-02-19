const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3005;

// create previews directory if it doesn't exist
const previewsDir = path.join(__dirname, 'previews');
fs.access(previewsDir, fs.constants.F_OK)
  .catch(() => fs.mkdir(previewsDir));

// create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.access(uploadsDir, fs.constants.F_OK)
  .catch(() => fs.mkdir(uploadsDir));

app.use(cors());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

async function checkFileExists(filePath) {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

// Set up multer to handle file uploads with validations
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const filename = req.query.filename;
    if (!filename) return cb(new Error('Filename is invalid'));
    const filePath = path.join(__dirname, 'uploads', filename);
    checkFileExists(filePath).then(fileExists => {
      if (fileExists) return cb(new Error('File already exists'));
      else return cb(null, filename);
    })
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      ![
        'application/octet-stream',
        'application/zip',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
      ].includes(file.mimetype)
    ) {
      return cb(new Error('Invalid file format'));
    }
    if (file.size > 5 * 1024 * 1024) {
      return cb(new Error('File size exceeds 5MB'));
    }
    if (file.size < 1024) {
      return cb(new Error('File size must be at least 1KB'));
    }
    cb(null, true);
  },
});

// Serve files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// File upload endpoint
function checkHeaderTokenMiddleware(req, res, next) {
  const token = req.headers.authorization;
  if(token === "Bearer Kx7tXMFwJ9kSsGhHU3ZWwrK5tZaTHMfHvmkxnhWsnHPfKmLQ") {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
}
app.post('/upload', checkHeaderTokenMiddleware, upload.single('file'), async (req, res) => {
  console.log(req.file);
  res.json({ filename: req.file.filename });
});

// File download preview endpoint
app.get('/download/:filename/preview', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'previews', filename);
  try {
    await fs.access(filePath, fs.constants.R_OK);
    res.download(filePath, filename);
  } catch (err) {
    console.error(`Error downloading file: ${err}`);
    const originalFilePath = path.join(__dirname, 'uploads', filename);
    try {
      sharp(originalFilePath)
      .greyscale()
      .jpeg({ quality: 5 })
      .blur(10)
      .toFile(filePath, (err, info) => {
        if (err) {
          console.error(err);
          res.status(404).send('File not found');
        } else {
          console.log('Image compressed successfully:', info);
          res.download(filePath, filename);
        }
      });
    } catch (err) {
      console.error(`Error downloading file: ${err}`);
      res.status(404).send('File not found');
    }
  }
});
// File download endpoint
app.get('/download/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);
  try {
    await fs.access(filePath, fs.constants.R_OK);
    res.download(filePath, filename);
  } catch (err) {
    console.error(`Error downloading file: ${err}`);
    res.status(404).send('File not found');
  }
});

app.get('/list', async (req, res) => {
    const files = await fs.readdir(path.join(__dirname, 'uploads'));
    res.json(files);
});

app.get('/list/previews', async (req, res) => {
    const files = await fs.readdir(path.join(__dirname, 'previews'));
    res.json(files);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
