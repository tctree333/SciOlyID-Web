const baseApiUrl = 'https://localhost:8000'
const urls = {
  base: baseApiUrl,
  upload: baseApiUrl + '/upload/',
  uploaded: baseApiUrl + '/upload/uploaded',
  delete: baseApiUrl + '/upload/delete/',
  image: baseApiUrl + '/upload/image',
  save: baseApiUrl + '/upload/save',
  status: baseApiUrl + '/upload/status',
  remote: baseApiUrl + '/upload/remote'

}
const classes = {
  duplicateImg: 'h-32 inline-block m-2 mb-4 rounded'
}
const MAXSIZE = 4000000
const VALID_MIMETYPES = ['image/jpeg', 'image/png']

window.Dropzone.autoDiscover = false
const previewTemplate = document.getElementById('template').innerHTML
const dropzone = new window.Dropzone(document.body, {
  url: urls.upload,
  thumbnailWidth: 138,
  thumbnailHeight: 138,
  previewTemplate: previewTemplate,
  autoQueue: false,
  parallelUploads: 1,
  previewsContainer: '#previews',
  clickable: '#clickable',
  acceptedFiles: 'image/jpeg,image/png',
  withCredentials: true,
  accept: (file, done) => {
    if (file.size > MAXSIZE) {
      dropzone.removeFile(file)
      done('File too big!')
    } else if (!VALID_MIMETYPES.includes(file.type)) {
      dropzone.removeFile(file)
      done('Invalid type!')
    } else {
      done()
    }
  },
  params: (files, xhr) => {
    const item = files[0].previewElement.querySelector('.itemPicker').value
    files.forEach((file) => {
      if (file.previewElement.querySelector('.itemPicker').value !== item) {
        throw new Error("Image items don't match!")
      }
    })
    return {
      item: item
    }
  },
  init: () => {
    setupSave()
    setupAddFromUrl()
    displayUploadedFiles()
  }
})

function setupSave () {
  const saveInfo = document.getElementById('saveInfo')
  saveInfo.hidden = true
  const button = document.getElementById('btnSave')
  button.addEventListener('click', () => {
    const saveStatus = document.getElementById('saveStatus')
    const saveProgress = document.getElementById('saveProgress')
    saveStatus.innerText = ''

    button.disabled = true
    dropzone.disable()
    document.getElementById('inputUrl').disabled = true
    document.getElementById('btnUrlConfirm').disabled = true
    document.getElementById('btnUrlOk').disabled = true
    saveInfo.hidden = false

    getJson(urls.save, {
      404: 'No images uploaded!',
      400: 'Save in progress!'
    }).then((data) => {
      dropzone.enable()
      document.getElementById('inputUrl').disabled = false
      document.getElementById('btnUrlConfirm').disabled = false
      document.getElementById('btnUrlOk').disabled = false
      if (!data) {
        button.disabled = false
        saveInfo.hidden = true
        return
      }

      saveStatus.innerText = data.status.join(', ')

      const checkStatus = setInterval(() => {
        getJson(urls.status, {
          404: 'Not currently saving!'
        }).then((data) => {
          if (!data) {
            return
          }
          if (data.end) {
            clearInterval(checkStatus)
            button.disabled = false
            saveInfo.hidden = true
            alertUser((data.status.includes('FAIL') ? 'Operation failed! Please report this incident.' : 'Images saved!'), !data.status.includes('FAIL'))
            const allow = dropzone.getAddedFiles().concat(dropzone.getUploadingFiles())
            dropzone.files.forEach((file) => {
              if (!allow.includes(file)) {
                file.clearing = true
                dropzone.removeFile(file)
              }
            })
            updateUploadedCount()
            setTimeout(displayUploadedFiles, 3000)
            return
          }
          if (data.max_count && data.cur_count) {
            saveProgress.style.width = ((data.cur_count / data.max_count) * 100) + '%'
          }
          if (data.op_code) {
            saveStatus.innerText = data.op_code.join(', ')
          }
          if (data.message) {
            saveStatus.innerText += '\n' + data.message
          }
        })
      }, 250)
    })
  })
}

function setupAddFromUrl () {
  const confirm = document.getElementById('btnUrlConfirm')
  const input = document.getElementById('inputUrl')
  const image = document.getElementById('imgUrlPreview')
  const errorText = document.getElementById('urlError')
  const popup = document.getElementById('addUrlPopup')
  const fileStore = document.getElementById('fileStore')
  const close = (close) => {
    error('')
    input.value = ''
    image.src = ''
    image.alt = ''
    confirm.disabled = true
    if (close === false) {
      return
    }
    popup.hidden = true
  }
  close()
  document.getElementById('btnUrl').addEventListener('click', () => {
    close()
    popup.hidden = false
  })

  function error (message) {
    if (message === '') {
      errorText.hidden = true
      return
    }
    errorText.hidden = false
    errorText.innerText = message
  }

  errorText.hidden = true
  confirm.disabled = true
  confirm.addEventListener('click', () => {
    confirm.disabled = true
    error('')
    if (fileStore.files.length === 0) {
      error('No file!')
      return
    }
    dropzone.addFile(fileStore.files[0])
    close()
  })
  document.getElementById('btnUrlOk').addEventListener('click', () => {
    error('')
    if (!input.validity.valid) {
      error('Invalid Url!')
      return
    }
    const url = new URL(urls.remote)
    url.searchParams.append('url', encodeURI(input.value))
    fetchImageFile(url, new URL(input.value).pathname.split('/').pop(), {
      400: 'Invalid URL!',
      404: 'Invalid image!'
    }).then((file) => {
      if (!file) {
        error('Error fetching image!')
        return
      }
      if (typeof file === 'string') {
        error(file)
        return
      }
      const dt = new DataTransfer()
      dt.items.add(file)
      fileStore.files = dt.files
      image.src = URL.createObjectURL(file)
      image.alt = 'Url Image Preview'
      confirm.disabled = false
    })
  })

  document.getElementById('btnUrlClose').onclick = close
  document.getElementById('btnUrlCancel').onclick = () => {
    close(input.value === '')
  }
}

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
}

function fileItemError (file, message) {
  file.previewElement.querySelector('[data-dz-errormessage]').innerText = message
  if (message === '') {
    file.previewElement.querySelector('[data-dz-errormessage]').hidden = true
    return
  }
  file.previewElement.querySelector('[data-dz-errormessage]').hidden = false
}

function updateUploadedCount () {
  getJson(urls.uploaded).then((files) => {
    let count = 0
    if (files) {
      for (const item in files) {
        count += files[item].length
      }
    }
    document.getElementById('uploadCount').innerText = count

    if (count > 0) {
      document.getElementById('btnSave').disabled = false
    } else {
      document.getElementById('btnSave').disabled = true
    }

    if (dropzone.files.length === 0 && +document.getElementById('uploadCount').innerText === 0) {
      dropzone.previewsContainer.querySelector('[data-placeholder]').hidden = false
    }
  })
}

function displayUploadedFiles () {
  getJson(urls.uploaded).then((files) => {
    if (!files) {
      return
    }
    for (const item in files) {
      files[item].forEach((filename) => {
        fetchImageFile(`${urls.image}/${item}/${filename}`, 'Previously Uploaded').then((file) => {
          file.fromServer = true
          file.serverAssignedId = filename.split('.')[0]
          file.idItemType = item
          dropzone.displayExistingFile(file, file.dataUrl, null, 'use-credentials')
        })
      })
    }
  })
}

async function getJson (url, messages) {
  const resp = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  })

  if (resp.status === 200) {
    const returnedData = await resp.json()
    return returnedData
  } else if (resp.status === 403) {
    alertUser('Please log in to continue!')
  } else if ([404, 400].includes(resp.status)) {
    if (messages && messages[resp.status]) {
      alertUser(messages[resp.status])
    }
  } else {
    alertUser('Something went wrong...')
  }
  return false
}

async function fetchImageFile (url, name, message) {
  const resp = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  })

  if (resp.status === 200) {
    const blob = await resp.blob()
    const file = new File([blob], name, {
      type: blob.type
    })
    file.dataUrl = url
    return file
  } else if (resp.status === 403) {
    alertUser('Please log in to continue!')
  } else if (resp.status in message) {
    return message[resp.status]
  } else if (resp.status === 404) {
    alertUser('An error occurred: File not found.')
  } else {
    alertUser('An error occurred when fetching files!')
  }
  return false
}

async function deleteImage (id) {
  const resp = await fetch(urls.delete + id, {
    method: 'DELETE',
    credentials: 'include'
  })
  const returnedData = await resp.json()

  if (resp.status === 403) {
    alertUser('Please log in to continue!')
  } else if (resp.status === 404) {
    alertUser('An error occurred when removing the file from the server: File not found.')
  } else if (resp.status === 200 && returnedData.deleted) {
    return true
  } else {
    alertUser('An error occurred when removing the file from the server!')
  }
}

dropzone.on('addedfile', (file) => {
  if (dropzone.files.length > 0) {
    dropzone.previewsContainer.querySelector('[data-placeholder]').hidden = true
  }

  if (file.displayErrorMessage) {
    fileItemError(file, file.displayErrorMessage)
  }
  file.previewElement.querySelector('.start').onclick = () => {
    if (file.previewElement.querySelector('.itemPicker').value !== '') {
      fileItemError(file, '')
      dropzone.enqueueFile(file)
      file.previewElement.querySelector('.animation').hidden = false
    } else {
      fileItemError(file, 'Error: Please select the item type!')
    }
  }
})

dropzone.on('sending', (file, xhr, formData) => {
  file.previewElement.querySelector('.start').disabled = true
  file.previewElement.querySelector('.itemPicker').disabled = true
})

dropzone.on('removedfile', (file) => {
  if (dropzone.files.length === 0 && +document.getElementById('uploadCount').innerText === 0) {
    dropzone.previewsContainer.querySelector('[data-placeholder]').hidden = false
  }
  if (file.clearing) {
    return
  }
  const imageId = file.previewElement.querySelector('.imageId').value
  if (imageId === '') {
    return
  }
  deleteImage(imageId).then(() => {
    updateUploadedCount()
  })
})

dropzone.on('complete', (file) => {
  file.previewElement.querySelector('.animation').hidden = true
  updateUploadedCount()
})

dropzone.on('success', (file, resp) => {
  if (file.name in resp.duplicates) {
    const duplicateContainer = file.previewElement.querySelector('.duplicates')
    // while (duplicateContainer.hasChildNodes()) {
    //   if (!duplicateContainer.lastChild.hasAttribute('data-text')) {
    //     duplicateContainer.removeChild(duplicateContainer.lastChild)
    //   }
    // }
    duplicateContainer.querySelector('[data-text]').hidden = false
    resp.duplicates[file.name].forEach((url) => {
      const img = document.createElement('img')
      img.src = url
      img.setAttribute('alt', 'a possible duplicate image')
      img.className = classes.duplicateImg
      duplicateContainer.appendChild(img)
    })
  } else if (resp.invalid.includes(file.name)) {
    fileItemError(file, 'Uploaded file is of an invalid type or is corrupted.')
  } else if (resp.rejected.includes(file.name)) {
    fileItemError(file, 'Uploaded file already exists!')
  }
  if (file.name in resp.sha1) {
    file.previewElement.querySelector('.imageId').value = resp.sha1[file.name]
    file.previewElement.querySelector('[data-upload-status]').innerHTML = 'Successfully Uploaded!'
    file.previewElement.querySelector('[data-upload-status]').hidden = false
  }
})

dropzone.on('error', (file, errorMessage, xhr) => {
  if (!xhr) {
    alertUser(errorMessage)
    return
  }
  switch (xhr.status) {
    case 403:
      alertUser('You must be logged in!')
      dropzone.removeFile(file)
      file.displayErrorMessage = 'Your session has expired!'
      dropzone.addFile(file)
      break
    case 415:
      alertUser('No files were uploaded.')
      dropzone.removeFile(file)
      break
    case 413:
      alertUser('An error occurred: 413')
      dropzone.removeFile(file)
      dropzone.addFile(file)
      break
    case 400:
      dropzone.removeFile(file)
      file.displayErrorMessage = 'Invalid item selected!\nTry again.'
      dropzone.addFile(file)
      break
  }
})

dropzone.on('thumbnail', (file, dataUrl) => {
  if (file.fromServer) {
    dropzone.previewsContainer.querySelector('[data-placeholder]').hidden = true

    const start = file.previewElement.querySelector('.start')
    const input = file.previewElement.querySelector('.itemPicker')
    start.parentNode.removeChild(start)
    input.disabled = true
    input.value = file.idItemType
    file.previewElement.querySelector('.imageId').value = file.serverAssignedId
  }
})
