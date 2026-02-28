import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ───────────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data)

// ─── Mesas ──────────────────────────────────────────────────────
export const getMesas = () => api.get('/mesas')
export const fusionarMesas = (data) => api.post('/mesas/fusionar', data)

// ─── Pedidos ────────────────────────────────────────────────────
export const getMenu = () => api.get('/pedidos/menu')
export const abrirCuenta = (data) => api.post('/pedidos/abrir-cuenta', data)
export const tomarOrden = (data) => api.post('/pedidos/ordenar', data)

// ─── Cocina ─────────────────────────────────────────────────────
export const getPendientes = () => api.get('/cocina/pendientes')
export const cambiarEstado = (id, nuevo_estado) =>
  api.patch(`/cocina/pedidos/${id}/estado`, { nuevo_estado })

// ─── Pagos ──────────────────────────────────────────────────────
export const getCuenta = (cuenta_id) => api.get(`/pagos/cuenta/${cuenta_id}`)
export const procesarPago = (data) => api.post('/pagos/pagar', data)

export default api
