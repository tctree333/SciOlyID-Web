/* global baseApiUrl */
const countUrls = {
  base: baseApiUrl,
  count: baseApiUrl + '/about/count'
}

fetch(countUrls.count, {
  method: 'GET',
  credentials: 'include'
}).then((resp) => {
  if (resp.status === 200) {
    return resp.json()
  }
  return new Promise((resolve, reject) => {
    resolve(false)
  })
}).then((data) => {
  if (!data) {
    return
  }
  document.getElementById('total').innerText = data.total
  data.counts.forEach(item => {
    if (item.group) {
      item.value.forEach(subitem => {
        document.getElementById(`item-${subitem.name}`).innerText = subitem.value
      })
    } else {
      document.getElementById(`item-${item.name}`).innerText = item.value
    }
  })
  const masterList = document.getElementById('list');
  [...masterList.children]
    .sort((a, b) => {
      const aGroup = a.dataset.group === 'true'
      const bGroup = b.dataset.group === 'true'
      if (aGroup || bGroup) {
        if (aGroup && bGroup) {
          return (a.querySelector('[data-name]').innerText > b.querySelector('[data-name]').innerText ? 1 : -1)
        } else {
          return (aGroup ? -1 : 1)
        }
      } else {
        return (a.querySelector('[data-value]').innerText > b.querySelector('[data-value]').innerText ? 1 : -1)
      }
    })
    .forEach(node => {
      masterList.appendChild(node)
    })
  for (const item of document.getElementsByClassName('item-list')) {
    [...item.children]
      .sort((a, b) => a.querySelector('[data-value]').innerText > b.querySelector('[data-value]').innerText ? 1 : -1)
      .forEach(node => item.appendChild(node))
  }
})
