const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Upload } = require('@aws-sdk/lib-storage');
const { GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/awsConfig');
const auth = require('../middlewares/authMiddleware');
const { fileIdValidation, renameValidation, folderValidation, deleteMultipleValidation } = require('../middlewares/validation');
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

    // Folder support: get folder from body, default to '/'
    const folder = req.body.folder || '/';

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}_${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
    };

    try {
        const upload = new Upload({
            client: s3Client,
            params: params
        });
        
        const uploadResult = await upload.done();

        if (fileType === 'image') {
            const newImage = new Image({
                userId: req.user.id,
                fileName: req.file.originalname,
                fileUrl: uploadResult.Location,
                fileSize: req.file.size,
                folder
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
                duration: duration ? Math.round(duration) : 0,
                folder
            });
            await newVideo.save();
            res.status(200).json({ msg: 'Video uploaded successfully!', url: uploadResult.Location });
        }
    } catch (error) {
        console.error('Error uploading file:', error.message);
        res.status(500).send('Server Error: Unable to upload file.');
    }
});

// Fetch files, optionally filter by folder
router.get('/files', auth, folderValidation, async (req, res) => {
    try {
        const folder = req.query.folder || '/';
        // Fetch files in the current folder
        const images = await Image.find({ userId: req.user.id, folder });
        const videos = await Video.find({ userId: req.user.id, folder });

        const files = [
            ...images.map(img => ({
                type: 'image',
                url: img.fileUrl,
                fileName: img.fileName,
                fileSize: img.fileSize,
                fileId: img._id,
                folder: img.folder,
                uploadDate: img.uploadDate
            })),
            ...videos.map(vid => ({
                type: 'video',
                url: vid.fileUrl,
                fileName: vid.fileName,
                fileSize: vid.fileSize,
                duration: vid.duration,
                fileId: vid._id,
                folder: vid.folder,
                uploadDate: vid.uploadDate
            }))
        ];

        // Find all unique subfolders directly under the current folder
        // e.g. if currentFolder is '/', and a file has folder '/holiday', then 'holiday' is a subfolder
        // if currentFolder is '/holiday', and a file has folder '/holiday/2024', then '2024' is a subfolder
        const folderRegex = folder === '/'
            ? new RegExp('^/([^/]+)')
            : new RegExp('^' + folder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/([^/]+)');

        // Get all folders for this user
        const allFoldersImages = await Image.find({ userId: req.user.id }, 'folder');
        const allFoldersVideos = await Video.find({ userId: req.user.id }, 'folder');
        const allFolders = [...allFoldersImages, ...allFoldersVideos].map(f => f.folder);

        // Find unique subfolders directly under the current folder
        const subfoldersSet = new Set();
        for (const f of allFolders) {
            if (f && f.startsWith(folder) && f !== folder) {
                const match = f.replace(folder === '/' ? '' : folder, '').match(/^\/([^/]+)/);
                if (match && match[1]) {
                    subfoldersSet.add(match[1]);
                }
            }
        }
        const folders = Array.from(subfoldersSet);

        res.json({ files, folders });
    } catch (error) {
        console.error('Error fetching files:', error.message);
        res.status(500).send('Server Error: Unable to fetch files.');
    }
});

// Delete Single File
router.delete('/delete/:fileId', auth, fileIdValidation, async (req, res) => {
    const { fileId } = req.params;

    try {
        const image = await Image.findById(fileId);
        const video = await Video.findById(fileId);

        if (!image && !video) {
            return res.status(404).json({ msg: 'File not found' });
        }

        const fileUrl = image ? image.fileUrl : video.fileUrl;
        const fileName = fileUrl.split('/').pop();

        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName
        }));

        if (image) await Image.findByIdAndDelete(fileId);
        if (video) await Video.findByIdAndDelete(fileId);

        res.status(200).json({ msg: 'File deleted successfully' });
    } catch (err) {
        console.error('Error deleting file:', err.message);
        res.status(500).send('Server Error: Unable to delete file.');
    }
});

// Delete Multiple Files
router.post('/delete-multiple', auth, deleteMultipleValidation, async (req, res) => {
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

                await s3Client.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: fileName
                }));

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

// Update File Name
router.put('/rename/:fileId', auth, renameValidation, async (req, res) => {
    const { fileId } = req.params;
    const { newFileName } = req.body;

    if (!newFileName) {
        return res.status(400).json({ msg: 'New file name is required' });
    }

    try {
        let isImage = false;
        let file = await Image.findById(fileId);
        if (file) {
            isImage = true;
        } else {
            file = await Video.findById(fileId);
        }

        if (!file) {
            return res.status(404).json({ msg: 'File not found' });
        }

        // Parse old S3 key from fileUrl
        const oldUrl = file.fileUrl;
        const urlParts = oldUrl.split('/');
        const oldKey = decodeURIComponent(urlParts.slice(3).join('/'));
        // S3 URL: https://<bucket>.s3.<region>.amazonaws.com/<key>

        // New S3 key (keep timestamp prefix if present)
        let prefix = '';
        const oldName = file.fileName;
        if (oldKey.includes('_')) {
            prefix = oldKey.split('_')[0] + '_';
        }
        const ext = oldName.includes('.') ? oldName.substring(oldName.lastIndexOf('.')) : '';
        const newKey = prefix + newFileName;

        // Copy object to new key
        await s3Client.send(new CopyObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            CopySource: `${process.env.AWS_BUCKET_NAME}/${oldKey}`,
            Key: newKey,
            ContentType: file.type || undefined
        }));

        // Delete old object
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldKey
        }));

        // Update MongoDB
        file.fileName = newFileName;
        // Construct new S3 URL
        const bucketRegion = process.env.AWS_REGION;
        const bucketName = process.env.AWS_BUCKET_NAME;
        file.fileUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${encodeURIComponent(newKey)}`;
        await file.save();

        res.status(200).json({ 
            msg: 'File name updated successfully',
            fileName: newFileName,
            fileUrl: file.fileUrl
        });
    } catch (err) {
        console.error('Error updating file name:', err.message);
        res.status(500).send('Server Error: Unable to update file name.');
    }
});

// Update File
router.put('/update/:fileId', auth, fileIdValidation, upload.single('file'), async (req, res) => {
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

        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldFileName
        }));

        const newUploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${Date.now()}_${req.file.originalname}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };

        const upload = new Upload({
            client: s3Client,
            params: newUploadParams
        });
        
        const uploadResult = await upload.done();

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
