import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost' })

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(r => r, async err => {
  if (err.response?.status === 401) {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) {
      try {
        const { data } = await axios.post('/api/auth/refresh/', { refresh })
        localStorage.setItem('token', data.access)
        err.config.headers.Authorization = `Bearer ${data.access}`
        return api.request(err.config)
      } catch { localStorage.clear(); window.location.href = '/login' }
    }
  }
  return Promise.reject(err)
})

export const authAPI = {
  register: d => api.post('/auth/register/', d),
  login: d => api.post('/auth/login/', d),
  logout: r => api.post('/auth/logout/', { refresh: r }),
  me: () => api.get('/auth/me/'),
}

export const eventsAPI = {
  list: p => api.get('/events/', { params: p }),
  get: id => api.get(`/events/${id}/`),
  create: d => api.post('/events/', d),
  update: (id, d) => api.patch(`/events/${id}/`, d),
  delete: id => api.delete(`/events/${id}/`),
}

export const ticketsAPI = {
  list: () => api.get('/tickets/'),
  get: id => api.get(`/tickets/${id}/`),
  purchase: d => api.post('/tickets/purchase/', d),
}

export default api
