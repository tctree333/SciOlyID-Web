const fetchInfo = require('./info.js')

async function filterUploaded() {
  return (await fetchInfo()).filter((bot) => bot.verify)
}

module.exports = filterUploaded
