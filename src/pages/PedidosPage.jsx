import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { getMesas, getMenu, abrirCuenta, tomarOrden } from '../api'
import { Plus, Minus, Send, ShoppingCart, Trash2, ChevronRight } from 'lucide-react'

export default function PedidosPage() {
  const qc = useQueryClient()
  const [step, setStep] = useState('mesa') // mesa | cuenta | menu | confirm
  const [mesaId, setMesaId] = useState(null)
  const [cuentaId, setCuentaId] = useState(null)
  const [carrito, setCarrito] = useState([]) // { producto, cantidad, cliente_nombre }
  const [clienteNombre, setClienteNombre] = useState('General')

  const { data: mesas = [] } = useQuery({
    queryKey: ['mesas'],
    queryFn: () => getMesas().then(r => r.data),
  })

  const { data: menu = [] } = useQuery({
    queryKey: ['menu'],
    queryFn: () => getMenu().then(r => r.data),
  })

  const abrirMutation = useMutation({
    mutationFn: (mesa_id) => abrirCuenta({ mesa_id }),
    onSuccess: ({ data }) => {
      setCuentaId(data.cuenta.id)
      toast.success(`Cuenta #${data.cuenta.id} abierta`)
      setStep('menu')
    },
    onError: (err) => {
      const msg = err.response?.data
      if (msg?.cuenta_id) {
        setCuentaId(msg.cuenta_id)
        toast('Cuenta ya abierta — usando existente', { icon: 'ℹ️' })
        setStep('menu')
      } else {
        toast.error(msg?.error || 'Error al abrir cuenta')
      }
    },
  })

  const ordenMutation = useMutation({
    mutationFn: (data) => tomarOrden(data),
    onSuccess: () => {
      toast.success('¡Orden enviada a cocina!')
      setCarrito([])
      setStep('mesa')
      setMesaId(null)
      setCuentaId(null)
      qc.invalidateQueries({ queryKey: ['mesas'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al enviar orden'),
  })

  // Menu agrupado por categoría
  const categorias = [...new Set(menu.map(p => p.categoria))]

  const addToCart = (producto) => {
    setCarrito(prev => {
      const existing = prev.find(i => i.producto.id === producto.id && i.cliente_nombre === clienteNombre)
      if (existing) {
        return prev.map(i =>
          i.producto.id === producto.id && i.cliente_nombre === clienteNombre
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      }
      return [...prev, { producto, cantidad: 1, cliente_nombre: clienteNombre }]
    })
  }

  const updateQty = (idx, delta) => {
    setCarrito(prev => {
      const updated = prev.map((item, i) =>
        i === idx ? { ...item, cantidad: item.cantidad + delta } : item
      ).filter(item => item.cantidad > 0)
      return updated
    })
  }

  const total = carrito.reduce((s, i) => s + i.producto.precio * i.cantidad, 0)

  const handleEnviar = () => {
    if (!carrito.length) return toast.error('El carrito está vacío')
    ordenMutation.mutate({
      cuenta_id: cuentaId,
      platillos: carrito.map(i => ({
        producto_id: i.producto.id,
        cantidad: i.cantidad,
        cliente_nombre: i.cliente_nombre,
      }))
    })
  }

  const mesasDisponibles = mesas.filter(m => m.estado !== 'fusionada_secundaria')

  return (
    <div style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Tomar Orden
        </h1>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {['Seleccionar mesa', 'Abrir cuenta', 'Agregar platillos'].map((s, i) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {i > 0 && <ChevronRight size={12} />}
              <span style={{
                color: ['mesa', 'cuenta', 'menu'][i] === step ? 'var(--accent)' : 'inherit',
                fontWeight: ['mesa', 'cuenta', 'menu'][i] === step ? 600 : 400,
              }}>{s}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{ flex: 1, overflow: 'auto' }}>

          {/* Step 1: Seleccionar mesa */}
          {step === 'mesa' && (
            <div className="animate-in">
              <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Selecciona una mesa
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                {mesasDisponibles.map(mesa => (
                  <button
                    key={mesa.id}
                    onClick={() => { setMesaId(mesa.id); setStep('cuenta') }}
                    className="card"
                    style={{
                      cursor: 'pointer', border: 'none', textAlign: 'left',
                      background: mesaId === mesa.id ? 'var(--accent-dim)' : 'var(--bg-surface)',
                      borderColor: mesaId === mesa.id ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800 }}>{mesa.numero}</div>
                    <span className={`badge ${mesa.estado === 'disponible' ? 'badge-green' : 'badge-orange'}`} style={{ marginTop: '6px' }}>
                      {mesa.estado === 'disponible' ? 'Libre' : 'Ocupada'}
                    </span>
                    {mesa.cuenta_activa_id && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        Cuenta #{mesa.cuenta_activa_id}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Abrir/usar cuenta */}
          {step === 'cuenta' && (
            <div className="animate-in">
              <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Mesa {mesas.find(m => m.id === mesaId)?.numero} — Cuenta
              </h2>

              {mesas.find(m => m.id === mesaId)?.cuenta_activa_id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="card">
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '13px' }}>
                      Esta mesa ya tiene una cuenta abierta.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setCuentaId(mesas.find(m => m.id === mesaId)?.cuenta_activa_id)
                        setStep('menu')
                      }}
                    >
                      Usar cuenta existente #{mesas.find(m => m.id === mesaId)?.cuenta_activa_id}
                    </button>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStep('mesa')}>← Volver</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="card">
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '13px' }}>
                      No hay cuenta abierta. Abre una para comenzar a tomar pedidos.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => abrirMutation.mutate(mesaId)}
                      disabled={abrirMutation.isPending}
                    >
                      {abrirMutation.isPending ? <span className="spinner" /> : 'Abrir cuenta'}
                    </button>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStep('mesa')}>← Volver</button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Menú */}
          {step === 'menu' && (
            <div className="animate-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Menú — Cuenta #{cuentaId}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Cliente:</label>
                  <input
                    className="input"
                    style={{ width: '140px' }}
                    value={clienteNombre}
                    onChange={e => setClienteNombre(e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>

              {categorias.map(cat => (
                <div key={cat} style={{ marginBottom: '24px' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '10px',
                    paddingBottom: '6px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {cat}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    {menu.filter(p => p.categoria === cat).map(producto => (
                      <button
                        key={producto.id}
                        onClick={() => addToCart(producto)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: '14px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--accent)'
                          e.currentTarget.style.background = 'var(--accent-dim)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)'
                          e.currentTarget.style.background = 'var(--bg-surface)'
                        }}
                      >
                        <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '4px' }}>{producto.nombre}</div>
                        {producto.descripcion && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{producto.descripcion}</div>
                        )}
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                          ${parseFloat(producto.precio).toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Carrito */}
        {step === 'menu' && (
          <div style={{
            width: '300px',
            minWidth: '300px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={15} />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Carrito</span>
              {carrito.length > 0 && (
                <span style={{
                  background: 'var(--accent)', color: 'white',
                  borderRadius: '10px', fontSize: '11px',
                  padding: '1px 7px', fontWeight: 700, marginLeft: 'auto',
                }}>
                  {carrito.reduce((s, i) => s + i.cantidad, 0)}
                </span>
              )}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {carrito.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', fontSize: '13px' }}>
                  Agrega platillos del menú
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {carrito.map((item, idx) => (
                    <div key={idx} style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '10px 12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.producto.nombre}</span>
                        <button onClick={() => updateQty(idx, -item.cantidad)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Para: {item.cliente_nombre}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => updateQty(idx, -1)}>
                            <Minus size={11} />
                          </button>
                          <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => updateQty(idx, 1)}>
                            <Plus size={11} />
                          </button>
                        </div>
                        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '13px' }}>
                          ${(item.producto.precio * item.cantidad).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>
                  ${total.toFixed(2)}
                </span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleEnviar}
                disabled={carrito.length === 0 || ordenMutation.isPending}
              >
                {ordenMutation.isPending ? <span className="spinner" /> : <><Send size={13} /> Enviar a cocina</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
