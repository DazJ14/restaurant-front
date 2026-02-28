import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getPendientes, cambiarEstado } from '../api'
import { useSocket } from '../hooks/useSocket'
import { ChefHat, Clock, CheckCircle, Truck, RefreshCw } from 'lucide-react'

const ESTADO_ORDER = ['pendiente', 'preparando', 'listo', 'entregado']
const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', cls: 'badge-red', btn: 'btn-primary', next: 'preparando', nextLabel: 'Preparar' },
  preparando: { label: 'Preparando', cls: 'badge-yellow', btn: 'btn-primary', next: 'listo', nextLabel: 'Marcar listo' },
  listo: { label: 'Listo ✓', cls: 'badge-green', btn: 'btn-success', next: 'entregado', nextLabel: 'Entregar' },
  entregado: { label: 'Entregado', cls: 'badge-blue', btn: null, next: null },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h`
}

export default function CocinaPage() {
  const qc = useQueryClient()

  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ['cocina'],
    queryFn: () => getPendientes().then(r => r.data),
    refetchInterval: 15000,
  })

  useSocket({
    nueva_orden_cocina: (data) => {
      toast(`🍽️ Nueva orden — Mesa ${data.mesa}`, { duration: 5000 })
      qc.invalidateQueries({ queryKey: ['cocina'] })
    },
  })

  const estadoMutation = useMutation({
    mutationFn: ({ id, nuevo_estado }) => cambiarEstado(id, nuevo_estado),
    onSuccess: (_, { nuevo_estado }) => {
      if (nuevo_estado === 'listo') toast.success('¡Platillo marcado como listo!')
      qc.invalidateQueries({ queryKey: ['cocina'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  // Group by estado
  const grupos = {
    pendiente: pedidos.filter(p => p.estado === 'pendiente'),
    preparando: pedidos.filter(p => p.estado === 'preparando'),
    listo: pedidos.filter(p => p.estado === 'listo'),
  }

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  return (
    <div style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(255,107,43,0.3)',
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <ChefHat size={20} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Cocina
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {pedidos.length} platillos activos
            </p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* KDS Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', flex: 1, overflow: 'hidden' }}>
        {Object.entries(grupos).map(([estado, items]) => {
          const cfg = ESTADO_CONFIG[estado]
          return (
            <div key={estado} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Column header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {estado === 'pendiente' && <Clock size={14} style={{ color: 'var(--red)' }} />}
                  {estado === 'preparando' && <ChefHat size={14} style={{ color: 'var(--yellow)' }} />}
                  {estado === 'listo' && <CheckCircle size={14} style={{ color: 'var(--green)' }} />}
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>
                    {estado === 'pendiente' ? 'Pendientes' : estado === 'preparando' ? 'Preparando' : 'Listos'}
                  </span>
                </div>
                {items.length > 0 && (
                  <span style={{
                    background: estado === 'pendiente' ? 'var(--red-dim)' : estado === 'preparando' ? 'var(--yellow-dim)' : 'var(--green-dim)',
                    color: estado === 'pendiente' ? 'var(--red)' : estado === 'preparando' ? 'var(--yellow)' : 'var(--green)',
                    borderRadius: '10px',
                    fontSize: '11px',
                    padding: '2px 8px',
                    fontWeight: 700,
                  }}>
                    {items.length}
                  </span>
                )}
              </div>

              {/* Items */}
              <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 16px', fontSize: '13px' }}>
                    Sin platillos
                  </div>
                ) : items.map(pedido => (
                  <div
                    key={pedido.pedido_id}
                    className="animate-in"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{pedido.platillo}</span>
                      <span className={`badge ${cfg.cls}`}>{pedido.cantidad}x</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                      }}>
                        Mesa {pedido.mesa_numero}
                      </span>
                      <span style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                      }}>
                        {pedido.cliente_nombre}
                      </span>
                      <span style={{ marginLeft: 'auto' }}>
                        <Clock size={10} style={{ display: 'inline', marginRight: 2 }} />
                        {timeAgo(pedido.creado_en)}
                      </span>
                    </div>

                    {cfg.next && (
                      <button
                        className={`btn ${cfg.btn} btn-sm`}
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={estadoMutation.isPending}
                        onClick={() => estadoMutation.mutate({ id: pedido.pedido_id, nuevo_estado: cfg.next })}
                      >
                        {cfg.next === 'listo' && <CheckCircle size={12} />}
                        {cfg.next === 'entregado' && <Truck size={12} />}
                        {cfg.nextLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
