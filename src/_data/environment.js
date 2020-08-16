require('dotenv').config({
  path: '.env.development'
})
module.exports = {
  prod: process.env.ELEVENTY_PRODUCTION === 'true'
}
