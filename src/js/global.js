const baseApiUrl = 'https://rfts.bird-id.ga'
const userUrls = {
  base: baseApiUrl,
  login: baseApiUrl + '/user/login',
  logout: baseApiUrl + '/user/logout',
  profile: baseApiUrl + '/user/profile'
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

fetch(userUrls.profile, {
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
      location.href = userUrls.logout
    })
  } else {
    document.getElementById('btnLogin').hidden = false
    document.getElementById('profile').classList.add('hidden')
    document.getElementById('btnLogin').addEventListener('click', () => {
      const url = new URL(userUrls.login)
      url.searchParams.append('redirect', new URL(location.href).pathname)
      location.href = url
    })
  }
})
