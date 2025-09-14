const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to check for errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            msg: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Auth validation rules
const registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// File validation rules
const fileIdValidation = [
    param('fileId')
        .isMongoId()
        .withMessage('Invalid file ID'),
    handleValidationErrors
];

const renameValidation = [
    param('fileId')
        .isMongoId()
        .withMessage('Invalid file ID'),
    body('newFileName')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('File name must be between 1 and 255 characters')
        .matches(/^[^<>:"/\\|?*]+$/)
        .withMessage('File name contains invalid characters'),
    handleValidationErrors
];

const folderValidation = [
    query('folder')
        .optional()
        .matches(/^\/[a-zA-Z0-9/_-]*$/)
        .withMessage('Invalid folder path'),
    handleValidationErrors
];

const deleteMultipleValidation = [
    body('fileIds')
        .isArray({ min: 1 })
        .withMessage('fileIds must be a non-empty array')
        .custom((fileIds) => {
            return fileIds.every(id => /^[a-fA-F0-9]{24}$/.test(id));
        })
        .withMessage('All file IDs must be valid MongoDB ObjectIds'),
    handleValidationErrors
];

module.exports = {
    registerValidation,
    loginValidation,
    fileIdValidation,
    renameValidation,
    folderValidation,
    deleteMultipleValidation,
    handleValidationErrors
};
