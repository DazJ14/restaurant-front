# RestaurantOS — Frontend

Frontend completo para el sistema de gestión de restaurante. Construido con **React + Vite**, **TanStack Query**, **Socket.io-client** y **Axios**.

---

## Stack

| Librería | Uso |
|---|---|
| React 18 + Vite | Framework + bundler |
| React Router v6 | Navegación y rutas protegidas |
| TanStack Query v5 | Fetching, caché e invalidación |
| Axios | Cliente HTTP con interceptores JWT |
| Socket.io-client | WebSockets en tiempo real |
| react-hot-toast | Notificaciones |
| lucide-react | Iconos |

---

## Instalación

```bash
cd restaurant-frontend
npm install
npm run dev
```

La app corre en `http://localhost:5173` y hace proxy al backend en `http://localhost:3000`.

> Asegúrate de que el backend esté corriendo (`docker compose up`) antes de abrir la app.

---

## Estructura

```
src/
├── api/
│   └── index.js          # Todas las llamadas HTTP (axios)
├── context/
│   └── AuthContext.jsx   # Estado global de autenticación
├── hooks/
│   └── useSocket.js      # Hook para suscribirse a eventos Socket.io
├── components/
│   └── Layout.jsx        # Sidebar + navegación principal
├── pages/
│   ├── LoginPage.jsx     # Login con credenciales de prueba
│   ├── MesasPage.jsx     # Mapa de mesas + fusión
│   ├── PedidosPage.jsx   # Tomar órdenes (flujo mesero)
│   ├── CocinaPage.jsx    # KDS de cocina con columnas Kanban
│   └── PagosPage.jsx     # Cobro y cierre de cuentas
├── App.jsx               # Router + rutas protegidas
└── main.jsx              # Entry point + QueryClient + Toaster
```

---

## Acceso por rol

| Rol | Ruta inicial | Acceso |
|---|---|---|
| Gerente (1) | `/mesas` | Todo |
| Recepcionista (2) | `/mesas` | Mesas, Pagos |
| Mesero (3) | `/pedidos` | Mesas, Pedidos, Pagos |
| Cocinero (4) | `/cocina` | Solo Cocina |

---

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `jagua` | `admin123` | Gerente |
| `ana_recepcion` | `ana123` | Recepcionista |
| `carlos_mesero` | `carlos123` | Mesero |
| `roberto_chef` | `roberto123` | Cocinero |

---

## WebSockets — Eventos escuchados

| Evento | Módulo | Acción |
|---|---|---|
| `mesas_actualizadas` | Mesas | Invalidar query `mesas` |
| `nueva_orden_cocina` | Cocina | Toast + invalidar `cocina` |
| `pedido_listo_para_entregar` | (disponible) | Notificación al mesero |

---

## Flujo de operación

1. **Login** → obtiene JWT, redirige según rol
2. **Recepcionista** → ve mapa de mesas, fusiona si hay grupo grande
3. **Mesero** → selecciona mesa → abre cuenta → agrega platillos al carrito → envía a cocina
4. **Cocinero** → ve columnas Kanban: Pendiente → Preparando → Listo
5. **Mesero/Recepcionista** → busca la cuenta → registra pagos (pueden ser divididos) → confirma → mesa se libera automáticamente
