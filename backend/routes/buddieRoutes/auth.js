const jwt = require('jsonwebtoken');

// Generate Token with an Expiry Time (e.g., 1 hour)
const generateToken = (buddie_id) => {
  return jwt.sign({ id: buddie_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Verify Token with Error Handling
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Handle the error, e.g., log it or rethrow it for the caller to handle
    console.error('Invalid or expired token:', err);
    return null;
  }
};

module.exports = { generateToken, verifyToken };
