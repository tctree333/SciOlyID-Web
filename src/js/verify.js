/* global baseApiUrl */
window.addEventListener('load', (event) => {
  setup()
  // popUpInstructions()
  updateImage()
})

const verifyUrls = {
  base: baseApiUrl,
  getImage: baseApiUrl + '/verify/',
  confirm: baseApiUrl + '/verify/confirm',
  stats: baseApiUrl + '/verify/stats'
}

const imageId = document.getElementById('imageId')

const classes = {
  duplicateImg: 'inline-block mx-auto mt-2 mb-4 rounded max-h-64 img:m-2'
}

function offset (set = undefined) {
  if (set === undefined) {
    return parseInt(localStorage.getItem('offset'))
  }
  localStorage.setItem('offset', set)
}

function setup () {
  [
    ['btnValid', 'valid'],
    ['btnDuplicate', 'duplicate'],
    ['btnInvalid', 'invalid']
  ].forEach((item) => {
    document.getElementById(item[0]).addEventListener('click', genValidation(item[1]))
    document.getElementById(item[0]).disabled = true
  })
  document.getElementById('btnSkip').addEventListener('click', () => {
    updateImage()
  })
  document.getElementById('btnBack').addEventListener('click', () => {
    updateImage(offset() - 1)
  })
}

// function popUpInstructions () {}

function alertUser (message, success) {
  const alertTemplate = document.getElementById('alertTemplate').content.querySelector('[data-template]').cloneNode(true)
  if (success === true) {
    alertTemplate.classList.add('bg-green-300')
    alertTemplate.classList.add('text-green-900')
  } else {
    alertTemplate.classList.add('bg-red-300')
    alertTemplate.classList.add('text-red-900')
  }
  alertTemplate.querySelector('[data-alert-text]').innerText = message
  alertTemplate.querySelector('[data-alert-close]').addEventListener('click', () => {
    alertTemplate.classList.add('opacity-0')
    setTimeout(() => {
      alertTemplate.parentNode.removeChild(alertTemplate)
    }, 500)
  })
  document.getElementById('alertContainer').appendChild(alertTemplate)
  setTimeout(() => {
    alertTemplate.classList.remove('opacity-0')
  }, 200)
  setTimeout(() => {
    alertTemplate.classList.add('opacity-0')
    setTimeout(() => {
      alertTemplate.parentNode.removeChild(alertTemplate)
    }, 500)
  }, 20 * 1000)
}

function hide () {
  document.getElementById('verifyContent').hidden = true
}

function clear () {
  ['btnValid', 'btnDuplicate', 'btnInvalid'].forEach((item) => {
    document.getElementById(item).disabled = true
  })
  imageId.value = ''
  document.getElementById('displayId').innerText = 'loading...'
  document.getElementById('item').innerText = '... '
  document.getElementById('mainImg').src = '/icons/illustrations/loading.svg'
  const duplicateContainer = document.getElementById('duplicates')
  duplicateContainer.hidden = true
  const text = duplicateContainer.querySelector('#duplicateText')
  while (duplicateContainer.hasChildNodes()) {
    duplicateContainer.removeChild(duplicateContainer.lastChild)
  }
  duplicateContainer.appendChild(text)
}

function updateImage (_offset = undefined) {
  clear()

  if (_offset === undefined) {
    _offset = offset() + 1
  }

  getRequest(verifyUrls.getImage, { offset: _offset }).then((stats) => {
    if (!stats) {
      return
    }
    if (stats.end) {
      alertUser("You've seen all of the images!")
      hide()
      return
    }
    offset(stats.offset)

    imageId.value = stats.id
    document.getElementById('displayId').innerText = stats.id.slice(0, 7)
    document.getElementById('item').innerText = stats.item

    const imgUrl = new URL(verifyUrls.base)
    imgUrl.pathname = stats.url
    document.getElementById('mainImg').src = imgUrl.toString()

    const duplicateContainer = document.getElementById('duplicates')
    const text = duplicateContainer.querySelector('#duplicateText')
    while (duplicateContainer.hasChildNodes()) {
      duplicateContainer.removeChild(duplicateContainer.lastChild)
    }
    duplicateContainer.appendChild(text)
    stats.duplicates.forEach((dupe) => {
      const img = document.createElement('img')
      img.src = dupe
      img.setAttribute('alt', 'a possible duplicate image')
      img.className = classes.duplicateImg
      duplicateContainer.appendChild(img)
    })
    if (stats.duplicates.length === 0) {
      duplicateContainer.hidden = true
    } else {
      duplicateContainer.hidden = false
    }

    ['btnValid', 'btnDuplicate', 'btnInvalid'].forEach((item) => {
      document.getElementById(item).disabled = false
    })

    updateStats()
  })
}

function updateStats () {
  getRequest(verifyUrls.stats, {
    id: imageId.value
  }).then((stats) => {
    if (!stats) {
      return
    }
    [
      ['numValid', 'valid'],
      ['numDuplicate', 'duplicate'],
      ['numInvalid', 'invalid']
    ].forEach((item) => {
      document.getElementById(item[0]).innerText = stats[item[1]]
    })
  })
}

async function getRequest (urlString, params) {
  const url = new URL(urlString)
  url.search = new URLSearchParams(params)

  const resp = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  })

  const returnedData = await resp.json()
  if (resp.status === 403) {
    alertUser('Please log in to continue!')
    hide()
  } else if (resp.status === 400) {
    alertUser('An error occurred: ' + returnedData.error)
    return false
  } else if (resp.status === 200) {
    return returnedData
  } else {
    alertUser('Something went wrong...')
    return false
  }
}

function genValidation (confirmation) {
  const wrapped = () => {
    document.getElementById('confirmation').value = confirmation
    const form = document.getElementById('hiddenForm')
    const data = new FormData(form)
    postValidation(data).then(() => {
      updateImage()
    })
  }
  return wrapped
}

async function postValidation (data) {
  const resp = await fetch(verifyUrls.confirm, {
    method: 'POST',
    credentials: 'include',
    body: data
  })

  const returnedData = await resp.json()
  if (resp.status === 403) {
    alertUser('Please log in to continue!')
    hide()
  } else if (resp.status === 400) {
    alertUser(returnedData.error)
  } else if (resp.status === 200 && returnedData.success) {
    alertUser('Ok!', true)
  } else {
    alertUser('Something went wrong...')
  }
}
