const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export function getToken() {
  return localStorage.getItem('token')
}

export function setAuth(token, user) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

async function request(method, path, { body, form, token } = {}) {
  const headers = {}
  const authToken = token || getToken()
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  let payload = body
  if (form) {
    payload = form
  } else if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: payload,
  })

  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { detail: text }
  }

  if (!res.ok) {
    let detail = data?.detail
    if (Array.isArray(detail)) {
      detail = detail.map((d) => d.msg).join(', ')
    }
    throw new ApiError(detail || `Request failed (${res.status})`, res.status)
  }
  return data
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
  upload: (path, form, opts) => request('POST', path, { ...opts, form }),

  // Auth
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  profile: () => api.get('/profile'),

  // Products
  createProduct: (data) => api.post('/products', data),
  listProducts: () => api.get('/products'),
  getProduct: (id) => api.get(`/products/${id}`),
  checkWarranty: (id) => api.get(`/products/${id}/warranty`),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  verifyQR: (code) => api.get(`/products/verify/qr/${code}`),

  // Invoices
  uploadInvoice: (productId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.upload(`/invoices/upload/${productId}`, form)
  },
  productInvoices: (productId) => api.get(`/invoices/product/${productId}`),

  // Claims
  createClaim: (data) => api.post('/claims', data),
  listClaims: () => api.get('/claims'),
  getClaim: (id) => api.get(`/claims/${id}`),
  updateClaimStatus: (id, data) => api.put(`/claims/${id}/status`, data),
  assignClaim: (id, serviceCenterId) => api.put(`/claims/${id}/assign`, { service_center_id: serviceCenterId }),
  rejectClaim: (id, note) => api.put(`/claims/${id}/reject`, { admin_note: note }),
  updateRepair: (id, repairStatus, note) => api.put(`/claims/${id}/repair`, { repair_status: repairStatus, admin_note: note }),

  // Service centers
  createCenter: (data) => api.post('/service-centers', data),
  listCenters: () => api.get('/service-centers'),
  updateCenter: (id, data) => api.put(`/service-centers/${id}`, data),
  deleteCenter: (id) => api.delete(`/service-centers/${id}`),

  // Notifications
  notifications: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),

  // Admin
  adminUsers: () => api.get('/admin/users'),
  dashboard: () => api.get('/analytics/dashboard'),
  claimsReport: () => api.rawGet('/analytics/reports/claims'),
  productsReport: () => api.rawGet('/analytics/reports/products'),

  // Chatbot
  ask: (message) => api.post('/chatbot/ask', { message }),

  rawGet: (path) => {
    const headers = {}
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${API_BASE}${path}`, { headers })
  },
}
