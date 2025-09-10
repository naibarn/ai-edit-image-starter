// Root wrapper: delegate to frontend/ if exists; else use local plugins
const fs = require('fs'); const path = require('path');
const fe = path.join(__dirname, 'frontend', 'postcss.config.js');
module.exports = fs.existsSync(fe) ? require(fe) : { plugins: { tailwindcss: {}, autoprefixer: {} } };