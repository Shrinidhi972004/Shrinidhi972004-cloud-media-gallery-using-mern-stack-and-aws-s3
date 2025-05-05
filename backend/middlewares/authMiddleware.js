const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // Get token from request header
    const token = req.header('Authorization'); 

    // Check if token is not provided
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);  // Extracting token after 'Bearer '

        // Fix: Attach the entire user object, not just the ID
        req.user = { id: decoded.userId };  

        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = auth;
