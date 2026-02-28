import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { login } from '../api'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

const ROL_DASHBOARD = { 1: '/mesas', 2: '/mesas', 3: '/pedidos', 4: '/cocina' }

export default function LoginPage() {
  const navigate = useNavigate()
  const { loginSuccess } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)

  const mutation = useMutation({
    mutationFn: () => login(form),
    onSuccess: ({ data }) => {
      loginSuccess(data.token, data.usuario)
      toast.success(`Bienvenido, ${data.usuario.nombre}`)
      navigate(ROL_DASHBOARD[data.usuario.rol_id] || '/mesas')
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.username || !form.password) return
    mutation.mutate()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.3,
      }} />
      {/* Glow */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(255,107,43,0.06) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />

      <div className="animate-in" style={{ position: 'relative', width: '100%', maxWidth: '380px', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>
            Restaurant<span style={{ color: 'var(--accent)' }}>OS</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
            Sistema de gestión de restaurante
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Usuario</label>
              <input
                className="input"
                type="text"
                placeholder="jagua"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={mutation.isPending}
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
            >
              {mutation.isPending ? <span className="spinner" /> : 'Iniciar sesión'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{
            marginTop: '24px',
            padding: '14px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Credenciales de prueba
            </div>
            {[
              { user: 'admin', pass: 'admin', rol: 'Gerente' }
            ].map(c => (
              <button
                key={c.user}
                type="button"
                onClick={() => setForm({ username: c.user, password: c.pass })}
                style={{
                  display: 'flex', width: '100%', justifyContent: 'space-between',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 0', color: 'var(--text-secondary)', fontSize: '12px',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: 'var(--accent)' }}>{c.user}</span>
                <span style={{ color: 'var(--text-muted)' }}>{c.rol}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
