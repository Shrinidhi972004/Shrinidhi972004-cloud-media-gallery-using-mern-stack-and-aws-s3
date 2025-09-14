const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    folder: { type: String, default: '/' }, // folder path, root by default
    uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Image', ImageSchema);
