const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },  
    duration: { type: Number },
    uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', VideoSchema);
