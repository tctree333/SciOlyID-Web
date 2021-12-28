const https = require('https')

const baseUrls = {
  // rfts: 'https://rfts.sciolyid.org',
  // fossils: 'https://fossils.sciolyid.org'
}
const names = {
  // rfts: 'Reach For the Stars',
  // fossils: 'Fossil ID'
}
const urlPaths = {
  items: '/about/list',
  info: '/about/info',
  media: '/about/count',
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        rejectUnauthorized: false,
      },
      (resp) => {
        if (resp.statusCode === 200) {
          let data = ''
          resp.on('data', (d) => {
            data += d.toString()
          })
          resp.on('end', () => {
            const json = JSON.parse(data)
            resolve(json)
          })
        } else {
          console.error(`Fetch failed with status code ${resp.status}`)
          resolve(false)
        }
      }
    )

    request.on('error', (e) => {
      console.error(e)
      reject(e)
    })
  })
}

async function fetchInfo() {
  const output = []
  for (const base in baseUrls) {
    const baseUrl = baseUrls[base]
    const obj = {
      name: names[base],
      id: base,
    }
    for (const path in urlPaths) {
      const url = baseUrl + urlPaths[path]
      const json = await getJson(url)
      if (json === false) {
        return
      }
      obj[path] = json
    }
    output.push(obj)
  }
  return output
}

// fetchInfo().then((info) => {
//   console.log(info)
// })

module.exports = fetchInfo
