const fetchInfo = require('./info.js')

async function filterUploaded() {
  return (await fetchInfo()).filter((bot) => bot.upload)
}

module.exports = filterUploaded
