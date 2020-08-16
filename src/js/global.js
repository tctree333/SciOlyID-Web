const base = 'https://localhost:8000'
const apiUrls = {
  base: base,
  login: base + '/user/login',
  logout: base + '/user/logout',
  profile: base + '/user/profile'
}

const debounce = (fn) => {
  let frame
  return (...params) => {
    if (frame) {
      cancelAnimationFrame(frame)
    }
    frame = requestAnimationFrame(() => {
      fn(...params)
    })
  }
}
const storeScroll = () => {
  document.documentElement.dataset.top = window.scrollY <= 12
}
document.addEventListener('scroll', debounce(storeScroll), {
  passive: true
})
storeScroll()

fetch(apiUrls.profile, {
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
  if (data) {
    document.getElementById('username').innerHTML = data.username
    document.getElementById('imgProfile').src = data.avatar
    document.getElementById('profile').classList.remove('hidden')
    document.getElementById('btnLogin').hidden = true
    document.getElementById('btnLogout').addEventListener('click', () => {
      location.href = apiUrls.logout
    })
  } else {
    document.getElementById('btnLogin').hidden = false
    document.getElementById('profile').classList.add('hidden')
    document.getElementById('btnLogin').addEventListener('click', () => {
      const url = new URL(apiUrls.login)
      url.searchParams.append('redirect', new URL(location.href).pathname)
      location.href = url
    })
  }
})
