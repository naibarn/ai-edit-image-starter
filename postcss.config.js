// Delegate to frontend/postcss.config.js if present; else use @tailwindcss/postcss+autoprefixer
const fs = require('fs'), path = require('path');
const fe = path.join(__dirname, 'frontend', 'postcss.config.js');
module.exports = fs.existsSync(fe) ? require(fe) : { plugins: { '@tailwindcss/postcss': {}, autoprefixer: {} } };