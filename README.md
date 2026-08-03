# Dashboard ERP

Panel administrativo tipo ERP con autenticación JWT, control de acceso basado en roles (RBAC), e-commerce mock (productos, clientes, pedidos), analytics con exportación de reportes, y un dashboard con métricas en tiempo real. Construido sobre la base del proyecto de aprendizaje [App_Login], integrando el template de UI [TailAdmin] (React + Tailwind) con datos reales.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Base de datos | PostgreSQL 17 |
| Backend | Python 3.13 + FastAPI + SQLAlchemy (async) + Alembic |
| Autenticación | JWT (access token + refresh token rotativo) + bcrypt |
| Frontend | React 19 + Vite + React Router + Tailwind CSS v4 + ApexCharts |
| UI base | TailAdmin (template libre), adaptado e integrado con datos reales |
| Reportes | pandas + openpyxl (exportación CSV/Excel) |
| Contenedores | Docker + Docker Compose (multi-stage build en frontend) |

## Sistema de roles (RBAC)

Cada usuario tiene un rol único, almacenado en `users.role`, validado en cada endpoint protegido mediante la dependencia `require_role(...)` de FastAPI y reflejado en el frontend (rutas y sidebar dinámicos).

| Rol | Acceso |
|---|---|
| `admin` | Acceso completo a todas las secciones, incluida gestión de usuarios |
| `proveedor` | Inventario (productos) |
| `analista` | Clientes, Analytics |
| `vendedor` | Pedidos |

El registro de cuentas **no es público**: solo un `admin` puede crear usuarios (incluida la asignación de rol), desde la sección "Usuarios". El primer administrador se crea manualmente en la base de datos (ver sección de instalación).

## Secciones de la aplicación

- **Dashboard**: métricas de clientes/pedidos con crecimiento mes a mes, ventas mensuales, meta mensual de ingresos ($7,500 fijo), pedidos recientes, clientes por país. Redirige automáticamente a la sección correspondiente si el rol del usuario no tiene acceso al dashboard general (`proveedor` → Inventario, `vendedor` → Pedidos).
- **Inventario**: CRUD de productos con filtro por nombre/categoría.
- **Clientes**: CRUD de clientes con filtro por nombre/email/país.
- **Pedidos**: creación con selector de cliente/productos (autocompletar), detalle con items, cambio de estado (Delivered/Pending/Canceled), control automático de stock (se descuenta al crear, se restaura al eliminar).
- **Analytics**: filtros de fecha (rápidos y rango custom con calendario), gráficas de ventas/clientes nuevos por día/mes/año, top productos, exportación de reportes (pedidos o resumen) en CSV o Excel.
- **Usuarios** (solo admin): listar, crear, editar rol, activar/desactivar cuentas.

## Modelo de base de datos

Además de `users` y `refresh_tokens` (heredadas del proyecto de login original, con la columna `role` agregada a `users`):

- **categories**: catálogo de categorías de producto.
- **products**: `category_id` (FK), precio, stock, imagen.
- **customers**: incluye `country` (usado en el widget de demografía del dashboard).
- **orders**: `customer_id` (FK), estado, total, fecha.
- **order_items**: tabla intermedia entre `orders` y `products`, con cantidad y precio unitario al momento de la venta.

Las tablas de e-commerce se poblaron con datos de prueba: `categories` insertadas manualmente, `products`/`customers` generados con Mockaroo, y `orders`/`order_items` con un script propio (`backend/scripts/seed_orders.py`) que distribuye pedidos realistas en los últimos 12 meses.

## Cómo levantar el proyecto

### Requisitos previos
Docker y Docker Compose instalados.

### Pasos

1. Clonar el repositorio.
2. Crear `.env` en la raíz con:
   ```
   JWT_SECRET_KEY=<generar con el comando de abajo>
   ```
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```
3. Levantar el stack:
   ```bash
   docker compose up -d --build
   ```
4. Las tablas se crean automáticamente vía Alembic al arrancar el backend.

### Crear el primer usuario administrador

Como el registro es exclusivo de administradores, el primer `admin` se crea manualmente:

1. Genera el hash de una contraseña:
   ```bash
   python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('tu_contraseña'))"
   ```
2. En DBeaver, inserta el usuario directamente:
   ```sql
   INSERT INTO users (username, email, password_hash, full_name, is_active, role)
   VALUES ('admin', 'admin@ejemplo.com', '<hash generado>', 'Administrador', true, 'admin');
   ```
3. Inicia sesión con esas credenciales; desde "Usuarios" ya puedes crear el resto de cuentas con sus roles correspondientes.

### Verificar
- Backend: http://localhost:8000/docs
- Frontend: http://localhost:5173

## Desarrollo local (sin Docker, para backend/frontend)

Igual que en el proyecto original: Postgres siempre en Docker; backend con `venv` + Uvicorn; frontend con `npm run dev`. Ver `backend/.env.example` para las variables necesarias.

## Notas de arquitectura y decisiones tomadas

- **`authRequest`** (frontend): envuelve las peticiones autenticadas, agregando el token automáticamente y reintentando con refresh si el access token expiró — sin que el usuario lo note.
- **`authDownload`**: variante de lo anterior para descargar archivos binarios (reportes), ya que un blob no puede procesarse como JSON.
- **`RoleProtectedRoute`**: capa adicional sobre `ProtectedRoute` que bloquea el acceso a rutas por rol (no solo por sesión), redirigiendo a `/` si el usuario no tiene permiso.
- **Autocompletar propio** (`Autocomplete.jsx`): reemplaza los `<select>` nativos en el formulario de pedidos por un componente con filtro en vivo, ya que el volumen de clientes/productos hacía los selects nativos poco prácticos.
- **Widget de países propio** (`CustomersByCountry.jsx`): reemplaza el mapa original del template (`@react-jvectormap`), que resultó incompatible con el bundler de Vite (dependencias internas pensadas para Webpack).
- **Sistema de Toasts propio** (`ToastContext.jsx`): notificaciones de éxito/error con iconografía específica por acción (crear/editar/eliminar/error), en vez de alertas nativas del navegador.

## Pendiente si este proyecto se llevara a producción real

Este es un proyecto de aprendizaje y no está pensado para desplegarse tal cual. Si se hiciera, quedaría pendiente:
- Cambiar `secure=False` a `True` en las cookies de refresh token (requiere servir todo por HTTPS).
- Ajustar `FRONTEND_URL`/CORS al dominio real.
- Revisar el historial de Git para confirmar que ningún `.env` real se haya subido por accidente.
- Considerar un sistema de permisos más granular (tabla de roles/permisos) si los 4 roles fijos actuales se quedaran cortos.
- Rate limiting en endpoints de autenticación.

## Aprendizajes clave de esta fase del proyecto

- Integración de un template de terceros (TailAdmin) con lógica de negocio y autenticación reales, incluyendo resolución de conflictos de bundler (Vite vs. dependencias pensadas para Webpack) y de tipado (TypeScript estricto conviviendo con JavaScript propio).
- Diseño e implementación de RBAC (control de acceso basado en roles) tanto en backend (dependencias de FastAPI reutilizables) como en frontend (rutas y UI condicionadas por rol).
- Modelado de un dominio de e-commerce con relaciones reales (categorías, productos, clientes, pedidos, items de pedido) y generación de datos de prueba realistas.
- Agregaciones y reportes con SQL (`date_trunc`, `GROUP BY`) y exportación de archivos con `pandas`.
- Componentes reutilizables de UI construidos desde cero cuando el template no cubría la necesidad (autocompletar, toasts, gráfico de barras simple) en vez de forzar una librería incompatible.