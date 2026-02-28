import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutGrid, UtensilsCrossed, ChefHat,
  CreditCard, LogOut, Wifi, WifiOff
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getSocket } from '../hooks/useSocket'

const ROL_NAMES = { 1: 'Gerente', 2: 'Recepcionista', 3: 'Mesero', 4: 'Cocinero' }

const NAV_ITEMS = [
  { to: '/mesas', icon: LayoutGrid, label: 'Mesas', roles: [1, 2, 3] },
  { to: '/pedidos', icon: UtensilsCrossed, label: 'Pedidos', roles: [1, 3] },
  { to: '/cocina', icon: ChefHat, label: 'Cocina', roles: [1, 4] },
  { to: '/pagos', icon: CreditCard, label: 'Pagos', roles: [1, 2, 3] },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = getSocket()
    setConnected(socket.connected)
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    return () => {
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(user?.rol_id))

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        minWidth: '220px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
            Restaurant<span style={{ color: 'var(--text-primary)' }}>OS</span>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{user?.nombre}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{ROL_NAMES[user?.rol_id]}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {visibleNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: connected ? 'var(--green)' : 'var(--text-muted)' }}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'En línea' : 'Sin conexión'}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ justifyContent: 'flex-start' }}>
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-base)' }}>
        {children}
      </main>
    </div>
  )
}
