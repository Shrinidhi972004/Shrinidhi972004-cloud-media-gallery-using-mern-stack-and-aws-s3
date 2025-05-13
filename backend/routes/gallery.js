const express = require('express');
const router = express.Router();
const multer = require('multer');
const s3 = require('../config/awsConfig');
const auth = require('../middlewares/authMiddleware');
const Image = require('../models/Image');
const Video = require('../models/Video');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { Readable } = require('stream');

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Utility to get video duration
const getVideoDuration = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        ffmpeg(stream).ffprobe((err, data) => {
            if (err) return reject(err);
            const duration = data.format.duration;
            resolve(duration);
        });
    });
};

// Upload Route
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    if (!req.user || !req.user.id) return res.status(401).send('User not authenticated.');

    // Log bucket for debugging
    if (!process.env.AWS_BUCKET_NAME) {
        console.error("❌ AWS_BUCKET_NAME is not defined in .env");
        return res.status(500).send("Server misconfiguration: Missing AWS_BUCKET_NAME.");
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const allowedVideoExtensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv', '.3gp', '.mpeg'];

    let fileType = '';
    if (req.file.mimetype.startsWith('image/')) {
        fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/') || allowedVideoExtensions.includes(fileExtension)) {
        fileType = 'video';
    } else {
        return res.status(400).send('Unsupported file type.');
    }

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}_${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
    };

    try {
        const uploadResult = await s3.upload(params).promise();

        if (fileType === 'image') {
            const newImage = new Image({
                userId: req.user.id,
                fileName: req.file.originalname,
                fileUrl: uploadResult.Location,
                fileSize: req.file.size
            });
            await newImage.save();
            res.status(200).json({ msg: 'Image uploaded successfully!', url: uploadResult.Location });
        } else {
            const duration = await getVideoDuration(req.file.buffer).catch(err => {
                console.error("❌ Failed to get video duration:", err.message);
                return null;
            });

            const newVideo = new Video({
                userId: req.user.id,
                fileName: req.file.originalname,
                fileUrl: uploadResult.Location,
                fileSize: req.file.size,
                duration: duration ? Math.round(duration) : 0
            });
            await newVideo.save();
            res.status(200).json({ msg: 'Video uploaded successfully!', url: uploadResult.Location });
        }
    } catch (error) {
        console.error('Error uploading file:', error.message);
        res.status(500).send('Server Error: Unable to upload file.');
    }
});

// Fetch Files Route
router.get('/files', auth, async (req, res) => {
    try {
        const images = await Image.find({ userId: req.user.id });
        const videos = await Video.find({ userId: req.user.id });

        const files = [
            ...images.map(img => ({
                type: 'image',
                url: img.fileUrl,
                fileName: img.fileName,
                fileSize: img.fileSize,
                fileId: img._id,
                uploadDate: img.uploadDate
            })),
            ...videos.map(vid => ({
                type: 'video',
                url: vid.fileUrl,
                fileName: vid.fileName,
                fileSize: vid.fileSize,
                duration: vid.duration,
                fileId: vid._id,
                uploadDate: vid.uploadDate
            }))
        ];

        res.json({ files });
    } catch (error) {
        console.error('Error fetching files:', error.message);
        res.status(500).send('Server Error: Unable to fetch files.');
    }
});

// Delete Single File
router.delete('/delete/:fileId', auth, async (req, res) => {
    const { fileId } = req.params;

    try {
        const image = await Image.findById(fileId);
        const video = await Video.findById(fileId);

        if (!image && !video) {
            return res.status(404).json({ msg: 'File not found' });
        }

        const fileUrl = image ? image.fileUrl : video.fileUrl;
        const fileName = fileUrl.split('/').pop();

        await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName
        }).promise();

        if (image) await Image.findByIdAndDelete(fileId);
        if (video) await Video.findByIdAndDelete(fileId);

        res.status(200).json({ msg: 'File deleted successfully' });
    } catch (err) {
        console.error('Error deleting file:', err.message);
        res.status(500).send('Server Error: Unable to delete file.');
    }
});

// Delete Multiple Files
router.post('/delete-multiple', auth, async (req, res) => {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ msg: 'No file IDs provided' });
    }

    try {
        for (const fileId of fileIds) {
            const image = await Image.findById(fileId);
            const video = await Video.findById(fileId);

            if (image || video) {
                const fileUrl = image ? image.fileUrl : video.fileUrl;
                const fileName = fileUrl.split('/').pop();

                await s3.deleteObject({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: fileName
                }).promise();

                if (image) await Image.findByIdAndDelete(fileId);
                if (video) await Video.findByIdAndDelete(fileId);
            }
        }

        res.status(200).json({ msg: 'Selected files deleted successfully' });
    } catch (err) {
        console.error('Error deleting multiple files:', err.message);
        res.status(500).send('Server Error: Unable to delete files.');
    }
});

// Update File
router.put('/update/:fileId', auth, upload.single('file'), async (req, res) => {
    const { fileId } = req.params;

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const image = await Image.findById(fileId);
        const video = await Video.findById(fileId);

        if (!image && !video) {
            return res.status(404).json({ msg: 'File not found' });
        }

        const oldFileUrl = image ? image.fileUrl : video.fileUrl;
        const oldFileName = oldFileUrl.split('/').pop();

        await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldFileName
        }).promise();

        const newUploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${Date.now()}_${req.file.originalname}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };

        const uploadResult = await s3.upload(newUploadParams).promise();

        if (image) {
            image.fileName = req.file.originalname;
            image.fileUrl = uploadResult.Location;
            image.fileSize = req.file.size;
            await image.save();
            res.status(200).json({ msg: 'Image updated successfully!', url: uploadResult.Location });
        } else if (video) {
            const duration = await getVideoDuration(req.file.buffer).catch(err => {
                console.error("❌ Failed to get video duration:", err.message);
                return null;
            });

            video.fileName = req.file.originalname;
            video.fileUrl = uploadResult.Location;
            video.fileSize = req.file.size;
            video.duration = duration ? Math.round(duration) : 0;
            await video.save();
            res.status(200).json({ msg: 'Video updated successfully!', url: uploadResult.Location });
        }
    } catch (err) {
        console.error('Error updating file:', err.message);
        res.status(500).send('Server Error: Unable to update file.');
    }
});

module.exports = router;
