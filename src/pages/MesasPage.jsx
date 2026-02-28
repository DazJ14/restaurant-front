import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { getMesas, fusionarMesas } from '../api'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../context/AuthContext'
import { Users, Merge, RefreshCw } from 'lucide-react'

const ESTADO_CONFIG = {
  disponible: { label: 'Libre', cls: 'badge-green', dot: 'dot-green' },
  ocupada: { label: 'Ocupada', cls: 'badge-orange', dot: 'dot-yellow' },
  reservada: { label: 'Reservada', cls: 'badge-blue', dot: 'dot-muted' },
}

export default function MesasPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selected, setSelected] = useState([])
  const [fusionMode, setFusionMode] = useState(false)

  const { data: mesas = [], isLoading, refetch } = useQuery({
    queryKey: ['mesas'],
    queryFn: () => getMesas().then(r => r.data),
  })

  useSocket({
    mesas_actualizadas: () => {
      qc.invalidateQueries({ queryKey: ['mesas'] })
      toast('🔄 Mesas actualizadas', { icon: '🍽️' })
    },
  })

  const fusionarMutation = useMutation({
    mutationFn: (data) => fusionarMesas(data),
    onSuccess: () => {
      toast.success('Mesas fusionadas')
      setSelected([])
      setFusionMode(false)
      qc.invalidateQueries({ queryKey: ['mesas'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al fusionar'),
  })

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleFusionar = () => {
    if (selected.length < 2) return toast.error('Selecciona al menos 2 mesas')
    const [principal, ...resto] = selected
    fusionarMutation.mutate({ mesa_principal_id: principal, mesas_a_fusionar: resto })
  }

  const canFusionar = [1, 2].includes(user?.rol_id)

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Mesas
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            {mesas.filter(m => m.estado === 'disponible').length} disponibles · {mesas.filter(m => m.estado === 'ocupada').length} ocupadas
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
            <RefreshCw size={13} />
            Actualizar
          </button>
          {canFusionar && (
            <button
              className={`btn btn-sm ${fusionMode ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setFusionMode(p => !p); setSelected([]) }}
            >
              <Merge size={13} />
              {fusionMode ? 'Cancelar fusión' : 'Fusionar mesas'}
            </button>
          )}
          {fusionMode && selected.length >= 2 && (
            <button
              className="btn btn-success btn-sm"
              onClick={handleFusionar}
              disabled={fusionarMutation.isPending}
            >
              {fusionarMutation.isPending ? <span className="spinner" /> : `Fusionar (${selected.length})`}
            </button>
          )}
        </div>
      </div>

      {fusionMode && (
        <div style={{
          background: 'var(--accent-dim)',
          border: '1px solid rgba(255,107,43,0.3)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: '24px',
          fontSize: '13px',
          color: 'var(--accent)',
        }}>
          Modo fusión activo — haz clic en las mesas a combinar. La primera seleccionada será la mesa principal.
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {mesas.map((mesa) => {
          const cfg = ESTADO_CONFIG[mesa.estado] || ESTADO_CONFIG.disponible
          const isSelected = selected.includes(mesa.id)
          const isPrincipal = selected[0] === mesa.id && fusionMode

          return (
            <div
              key={mesa.id}
              className="card"
              onClick={() => fusionMode && toggleSelect(mesa.id)}
              style={{
                cursor: fusionMode ? 'pointer' : 'default',
                border: isSelected
                  ? `2px solid var(--accent)`
                  : '1px solid var(--border)',
                background: isSelected ? 'var(--accent-dim)' : 'var(--bg-surface)',
                transition: 'all 0.15s',
                position: 'relative',
                animation: 'fadeIn 0.3s ease forwards',
              }}
            >
              {isPrincipal && (
                <div style={{
                  position: 'absolute', top: '-1px', left: '12px',
                  background: 'var(--accent)',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '0 0 6px 6px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>Principal</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '28px',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: mesa.estado === 'disponible' ? 'var(--text-primary)' : 'var(--accent)',
                  }}>
                    {mesa.numero}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Mesa</div>
                </div>
                <span className={`badge ${cfg.cls}`}>
                  <span className={`dot ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                <Users size={12} />
                {mesa.capacidad} personas
              </div>

              {mesa.cuenta_activa_id && (
                <div style={{
                  marginTop: '10px',
                  padding: '6px 10px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                }}>
                  Cuenta #{mesa.cuenta_activa_id}
                </div>
              )}

              {mesa.mesa_padre_id && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Fusionada con mesa #{mesa.mesa_padre_id}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
