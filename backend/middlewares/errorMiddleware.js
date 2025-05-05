// errorMiddleware.js

const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);  // Log the full error stack trace for debugging

    // Check if the error has a custom status code
    if (err.statusCode) {
        // If the error has a custom status code, use it
        return res.status(err.statusCode).json({
            message: err.message || 'Something went wrong.',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack  // Hide stack trace in production
        });
    }

    // If the error doesn't have a custom status code, return a 500 Internal Server Error
    res.status(500).json({
        message: 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack  // Hide stack trace in production
    });
};

module.exports = errorMiddleware;
