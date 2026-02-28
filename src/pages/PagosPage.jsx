import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { getMesas, getCuenta, procesarPago } from '../api'
import { CreditCard, Banknote, Search, CheckCircle, Users } from 'lucide-react'

export default function PagosPage() {
  const qc = useQueryClient()
  const [cuentaIdInput, setCuentaIdInput] = useState('')
  const [cuentaId, setCuentaId] = useState(null)
  const [pagos, setPagos] = useState([{ cliente_nombre: '', monto: '', metodo_pago: 'efectivo' }])

  const { data: mesas = [] } = useQuery({
    queryKey: ['mesas'],
    queryFn: () => getMesas().then(r => r.data),
  })

  const { data: cuenta, isLoading: loadingCuenta, error: cuentaError, refetch } = useQuery({
    queryKey: ['cuenta', cuentaId],
    queryFn: () => getCuenta(cuentaId).then(r => r.data),
    enabled: !!cuentaId,
  })

  const pagoMutation = useMutation({
    mutationFn: (data) => procesarPago(data),
    onSuccess: () => {
      toast.success('¡Pago procesado y mesa liberada!')
      setCuentaId(null)
      setCuentaIdInput('')
      setPagos([{ cliente_nombre: '', monto: '', metodo_pago: 'efectivo' }])
      qc.invalidateQueries({ queryKey: ['mesas'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al procesar pago'),
  })

  const handleBuscar = (e) => {
    e.preventDefault()
    if (!cuentaIdInput) return
    setCuentaId(parseInt(cuentaIdInput))
  }

  const addPago = () => {
    setPagos(prev => [...prev, { cliente_nombre: '', monto: '', metodo_pago: 'efectivo' }])
  }

  const updatePago = (idx, field, val) => {
    setPagos(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p))
  }

  const removePago = (idx) => {
    setPagos(prev => prev.filter((_, i) => i !== idx))
  }

  const totalPagos = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0)
  const diferencia = cuenta ? cuenta.gran_total - totalPagos : 0

  const handlePagar = () => {
    const pagosValidos = pagos.filter(p => p.cliente_nombre && p.monto && parseFloat(p.monto) > 0)
    if (!pagosValidos.length) return toast.error('Agrega al menos un pago válido')
    pagoMutation.mutate({
      cuenta_id: cuentaId,
      pagos: pagosValidos.map(p => ({
        cliente_nombre: p.cliente_nombre,
        monto: parseFloat(p.monto),
        metodo_pago: p.metodo_pago,
      }))
    })
  }

  // Quick access: mesas ocupadas con cuenta
  const mesasConCuenta = mesas.filter(m => m.cuenta_activa_id)

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Pagos
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Procesa pagos y libera mesas
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Buscar cuenta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Mesas con cuentas activas */}
          {mesasConCuenta.length > 0 && (
            <div className="card">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Mesas con cuenta activa
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {mesasConCuenta.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setCuentaId(m.cuenta_activa_id); setCuentaIdInput(String(m.cuenta_activa_id)) }}
                    style={{
                      background: cuentaId === m.cuenta_activa_id ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      border: `1px solid ${cuentaId === m.cuenta_activa_id ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      transition: 'all 0.15s',
                    }}
                  >
                    Mesa {m.numero} · #{m.cuenta_activa_id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual search */}
          <div className="card">
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Buscar por ID de cuenta
            </div>
            <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                type="number"
                placeholder="ID de cuenta..."
                value={cuentaIdInput}
                onChange={e => setCuentaIdInput(e.target.value)}
              />
              <button className="btn btn-ghost" type="submit">
                <Search size={14} />
              </button>
            </form>
          </div>

          {/* Cuenta detalle */}
          {loadingCuenta && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <span className="spinner" />
            </div>
          )}

          {cuentaError && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', padding: '14px', fontSize: '13px', color: 'var(--red)' }}>
              Cuenta no encontrada
            </div>
          )}

          {cuenta && (
            <div className="card animate-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>Cuenta #{cuenta.cuenta_id}</div>
                  <span className={`badge ${cuenta.estado === 'abierta' ? 'badge-green' : 'badge-blue'}`} style={{ marginTop: '4px' }}>
                    {cuenta.estado}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--accent)' }}>
                    ${cuenta.gran_total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Desglose por cliente */}
              {cuenta.cuentas_separadas.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={11} /> Desglose por cliente
                  </div>
                  {cuenta.cuentas_separadas.map((c, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius)',
                      padding: '10px 12px',
                      marginBottom: '6px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 500, fontSize: '13px' }}>{c.cliente_nombre}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>${parseFloat(c.total_a_pagar).toFixed(2)}</span>
                      </div>
                      {c.detalle?.map((d, j) => (
                        <div key={j} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {d.cantidad}x {d.platillo} · ${parseFloat(d.precio_unitario).toFixed(2)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Formulario de pago */}
        {cuenta && cuenta.estado === 'abierta' && (
          <div className="card animate-in">
            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={16} style={{ color: 'var(--accent)' }} />
              Registrar pago
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {pagos.map((pago, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Pago {idx + 1}
                    </span>
                    {pagos.length > 1 && (
                      <button
                        onClick={() => removePago(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      className="input"
                      placeholder="Nombre del cliente"
                      value={pago.cliente_nombre}
                      onChange={e => updatePago(idx, 'cliente_nombre', e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className="input"
                        type="number"
                        placeholder="Monto"
                        value={pago.monto}
                        onChange={e => updatePago(idx, 'monto', e.target.value)}
                      />
                      <select
                        className="input"
                        value={pago.metodo_pago}
                        onChange={e => updatePago(idx, 'metodo_pago', e.target.value)}
                        style={{ width: '130px', minWidth: '130px' }}
                      >
                        <option value="efectivo">💵 Efectivo</option>
                        <option value="terminal">💳 Terminal</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-ghost btn-sm" onClick={addPago} style={{ marginBottom: '16px', width: '100%', justifyContent: 'center' }}>
              + Agregar pago separado
            </button>

            {/* Summary */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total cuenta</span>
                <span>${cuenta.gran_total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total pagado</span>
                <span style={{ color: 'var(--green)' }}>${totalPagos.toFixed(2)}</span>
              </div>
              {diferencia !== 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: diferencia > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {diferencia > 0 ? 'Falta' : 'Cambio'}
                  </span>
                  <span style={{ color: diferencia > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                    ${Math.abs(diferencia).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handlePagar}
              disabled={pagoMutation.isPending || totalPagos <= 0}
            >
              {pagoMutation.isPending ? <span className="spinner" /> : <><CheckCircle size={14} /> Confirmar pago y liberar mesa</>}
            </button>
          </div>
        )}

        {cuenta && cuenta.estado === 'pagada' && (
          <div style={{
            background: 'var(--green-dim)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            textAlign: 'center',
            color: 'var(--green)',
          }}>
            <CheckCircle size={32} style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: '16px' }}>Cuenta ya pagada</div>
            <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.8 }}>Esta cuenta ya fue cerrada</div>
          </div>
        )}
      </div>
    </div>
  )
}
