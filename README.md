# Ecommerce Backend API

Backend profesional para plataforma de comercio electrónico desarrollado con **Node.js 20+**, **Express**, **MongoDB**, **Mongoose**, **Passport JWT**, **bcrypt**, **Nodemailer**, estructurado bajo una estricta **Arquitectura en Capas** con **Repository Pattern** y **Data Access Object (DAO)**.

---

## Índice

1. [Descripción General](#descripción-general)
2. [Tecnologías Obligatorias](#tecnologías-obligatorias)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Arquitectura y Patrones de Diseño](#arquitectura-y-patrones-de-diseño)
   - [Flujo de Ejecución](#flujo-de-ejecución)
   - [Capa DAO (Data Access Object)](#capa-dao-data-access-object)
   - [Capa Repository](#capa-repository)
   - [Capa Service](#capa-service)
   - [Capa DTO (Data Transfer Object)](#capa-dto-data-transfer-object)
5. [Variables de Entorno y Seguridad](#variables-de-entorno-y-seguridad)
6. [Instalación y Configuración](#instalación-y-configuración)
7. [Scripts Disponibles](#scripts-disponibles)
8. [Creación del Administrador](#creación-del-administrador)
9. [Autenticación y Autorización](#autenticación-y-autorización)
   - [Passport JWT y Estrategia `current`](#passport-jwt-y-estrategia-current)
   - [Almacenamiento en Cookie httpOnly y Bearer Token](#almacenamiento-en-cookie-httponly-y-bearer-token)
   - [Control de Acceso Basado en Roles (RBAC)](#control-de-acceso-basado-en-roles-rbac)
10. [Módulos del Sistema](#módulos-del-sistema)
    - [Usuarios](#usuarios)
    - [Productos](#productos)
    - [Carritos y Control de Propiedad](#carritos-y-control-de-propiedad)
    - [Proceso de Compra Atómica y Generación de Tickets](#proceso-de-compra-atómica-y-generación-de-tickets)
    - [Tickets de Compra](#tickets-de-compra)
    - [Recuperación de Contraseña con Nodemailer](#recuperación-de-contraseña-con-nodemailer)
11. [Manejo Centralizado de Errores](#manejo-centralizado-de-errores)
12. [Tabla Resumen de Endpoints de la API](#tabla-resumen-de-endpoints-de-la-api)
13. [Pruebas Automatizadas y Manuales](#pruebas-automatizadas-y-manuales)
14. [Consideraciones de Seguridad y Buenas Prácticas (.env y Git)](#consideraciones-de-seguridad-y-buenas-prácticas-env-y-git)

---

## 1. Descripción General

`ecommerce-backend` es una API REST robusta, modular y desacoplada construida para cumplir con los más exigentes estándares de diseño de software backend. Garantiza transaccionalidad atómica en la gestión de inventarios, aislamiento de recursos por usuario, control estricto de roles administrativos, protección de datos sensibles en respuestas HTTP y hashing criptográfico en flujos de autenticación y reseteo de credenciales.

---

## 2. Tecnologías Obligatorias

- **Node.js (v20+)**: Entorno de ejecución en tiempo de desarrollo y producción utilizando ES Modules (`"type": "module"`).
- **Express**: Framework web minimalista para el enrutamiento HTTP y gestión de middlewares.
- **MongoDB**: Base de datos NoSQL documental.
- **Mongoose**: Modelado de objetos para MongoDB (ODM) con validaciones y esquemas fuertemente tipados.
- **Passport & passport-jwt**: Middleware de autenticación con estrategia personalizada `current`.
- **JSON Web Token (jsonwebtoken)**: Firma y validación de tokens de sesión sin estado.
- **bcrypt**: Algoritmo de hashing adaptativo con salts aleatorios para contraseñas.
- **Nodemailer**: Cliente SMTP para despacho de correos electrónicos transaccionales en HTML.
- **cookie-parser**: Análisis y extracción segura de cookies httpOnly en cabeceras HTTP.
- **dotenv**: Gestión de variables de configuración de entorno.
- **express-validator**: Validación declarativa y sanitización de payloads entrantes.
- **supertest & mongodb-memory-server**: Pruebas de integración HTTP y base de datos en memoria 100% aisladas.

---

## 3. Estructura del Proyecto

```
ecommerce-backend/
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── database.js
│   │   ├── dependencies.js
│   │   ├── env.js
│   │   └── passport.config.js
│   ├── controllers/
│   │   ├── cart.controller.js
│   │   ├── product.controller.js
│   │   ├── purchase.controller.js
│   │   ├── session.controller.js
│   │   └── ticket.controller.js
│   ├── dao/
│   │   ├── cart.dao.js
│   │   ├── product.dao.js
│   │   ├── ticket.dao.js
│   │   └── user.dao.js
│   ├── dto/
│   │   └── current-user.dto.js
│   ├── middlewares/
│   │   ├── authentication.js
│   │   ├── authorization.js
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   └── validation.js
│   ├── models/
│   │   ├── cart.model.js
│   │   ├── product.model.js
│   │   ├── ticket.model.js
│   │   └── user.model.js
│   ├── repositories/
│   │   ├── cart.repository.js
│   │   ├── product.repository.js
│   │   ├── ticket.repository.js
│   │   └── user.repository.js
│   ├── routes/
│   │   ├── carts.router.js
│   │   ├── products.router.js
│   │   ├── sessions.router.js
│   │   └── tickets.router.js
│   ├── scripts/
│   │   └── create-admin.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── cart.service.js
│   │   ├── email.service.js
│   │   ├── password-recovery.service.js
│   │   ├── product.service.js
│   │   ├── purchase.service.js
│   │   ├── ticket.service.js
│   │   └── user.service.js
│   └── utils/
│       ├── auth-cookie.js
│       ├── code-generator.js
│       ├── httpError.js
│       ├── jwt.js
│       ├── password.js
│       └── reset-token.js
└── tests/
    ├── manual-tests.md
    └── api.test.js
```

---

## 4. Arquitectura y Patrones de Diseño

El sistema respeta estrictamente el principio de responsabilidad única (SRP), separación de intereses (SoC) y la inversión de dependencias (DIP).

### Flujo de Ejecución

```
HTTP Request
     │
     ▼
  Router          (Define rutas y aplica middlewares declarativos)
     │
     ▼
Middleware        (Validación de body, autenticación JWT, autorización de roles)
     │
     ▼
Controller        (Extrae datos HTTP req.body/params/query, invoca Service, responde status y JSON)
     │
     ▼
  Service         (Lógica de negocio pura, cálculo de subtotales, reglas de checkout)
     │
     ▼
Repository        (Abstrae la persistencia de datos proveyendo una interfaz orientada al dominio)
     │
     ▼
    DAO           (Data Access Object: interactúa directamente con los modelos de Mongoose)
     │
     ▼
Mongoose Model    (Define esquemas, tipos, validadores de BD, hooks pre-save y métodos)
     │
     ▼
  MongoDB         (Motor de base de datos)
```

### Reglas Arquitectónicas Inquebrantables
1. **Controllers**: Manejan exclusivamente la capa HTTP (`req`, `res`, `next`). Nunca acceden ni conocen a Mongoose.
2. **Services**: Contienen la totalidad de las reglas de negocio. **Nunca importan modelos de Mongoose directamente**; acceden exclusivamente a través de los **Repositories**.
3. **Repositories**: Abstraen a los DAOs, desacoplando la lógica de negocio de la tecnología de persistencia concreta.
4. **DAOs**: Son los únicos autorizados para ejecutar métodos de Mongoose (`save`, `findOne`, `findOneAndUpdate`, etc.).
5. **Inyección de Dependencias**: Centralizada en `src/config/dependencies.js`, lo que facilita la instanciación limpia y el testing sin efectos colaterales.

### Capa DTO (Data Transfer Object)
El DTO `CurrentUserDTO` (`src/dto/current-user.dto.js`) se encarga de transformar la entidad User en un objeto de salida seguro que incluye únicamente:
- `id`
- `first_name`
- `last_name`
- `email`
- `age`
- `role`

Se garantiza que contraseñas en texto plano, hashes de bcrypt, tokens JWT y hashes o fechas de reseteo de clave **nunca sean expuestos al exterior**.

---

## 5. Variables de Entorno y Seguridad

El proyecto valida la presencia de las variables críticas en el inicio de la aplicación (`src/config/env.js`). Si alguna variable obligatoria falta, el proceso se detiene inmediatamente con un mensaje explícito.

Crea un archivo `.env` en la raíz del proyecto tomando como plantilla `.env.example`:

```env
# Configuración del Servidor
NODE_ENV=development
PORT=8080

# Base de Datos MongoDB (Obligatoria)
MONGO_URL=mongodb://127.0.0.1:27017/ecommerce

# Firma y Expiración JWT (Obligatoria)
JWT_SECRET=tu_clave_secreta_super_segura_y_aleatoria
JWT_EXPIRES_IN=1d
JWT_COOKIE_NAME=jwt

# Recuperación de Contraseña y Frontend
RESET_PASSWORD_EXPIRES_MINUTES=60
FRONTEND_URL=http://localhost:3000

# Nodemailer / Servidor de Correo SMTP
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=tu_email@example.com
MAIL_PASSWORD=tu_password_smtp
MAIL_FROM=noreply@ecommerce.com

# Administrador Inicial por Script
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPassword123
```

---

## 6. Instalación y Configuración

1. Asegúrate de tener instalado **Node.js 20+** y **npm**:
   ```bash
   node -v
   npm -v
   ```

2. Clona o ingresa al directorio del proyecto:
   ```bash
   cd ecommerce-backend
   ```

3. Copia el archivo de variables de entorno y ajusta tus credenciales:
   ```bash
   cp .env.example .env
   ```

4. Instala las dependencias:
   ```bash
   npm install
   ```

---

## 7. Scripts Disponibles

En `package.json` se encuentran definidos los siguientes scripts estandarizados:

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga en caliente automática (`node --watch`). |
| `npm start` | Inicia el servidor en modo producción (`node src/server.js`). |
| `npm run create-admin` | Ejecuta el script de aprovisionamiento seguro del usuario Administrador en MongoDB. |
| `npm test` | Ejecuta la suite de pruebas unitarias y de integración completas mediante `node --test`. |

---

## 8. Creación del Administrador

Por motivos estrictos de seguridad:
- El registro público (`POST /api/sessions/register`) **siempre crea usuarios con `role: user`**, ignorando cualquier parámetro de rol enviado en la petición.
- Para crear un usuario administrador o ascender uno existente, se utiliza el script dedicado:

```bash
npm run create-admin
```

**Comportamiento del script (`src/scripts/create-admin.js`):**
1. Se conecta a MongoDB utilizando `MONGO_URL`.
2. Lee `ADMIN_EMAIL` y `ADMIN_PASSWORD` definidos en `.env`.
3. Si el usuario no existe, lo crea con `role: 'admin'`, hashea su contraseña con bcrypt y le crea su respectivo carrito.
4. Si ya existe, actualiza su rol a `admin` y asegura que cuente con un carrito.
5. Cierra la conexión de forma segura.
6. **Nunca imprime la contraseña en los logs de consola.**

---

## 9. Autenticación y Autorización

### Passport JWT y Estrategia `current`
La autenticación se implementa con **Passport** sin sesiones (`session: false`), haciendo que el servidor sea completamente stateless:
- Estrategia: `'current'` (`src/config/passport.config.js`).
- El JWT contiene en su payload: `{ sub: user._id, role: user.role }`.
- No almacena contraseñas ni datos sensibles en el token.
- Al verificar el token, se recupera la entidad completa del usuario directamente desde MongoDB para garantizar que la cuenta siga activa y válida.

### Almacenamiento en Cookie httpOnly y Bearer Token
El extractor de Passport inspecciona dos canales prioritarios:
1. **Cookie httpOnly (`req.cookies.jwt`)**: Previene ataques XSS al ser inaccesible mediante JavaScript en el navegador cliente.
2. **Authorization Header**: Soporta el esquema estándar `Authorization: Bearer <TOKEN>`, ideal para clientes móviles o herramientas como cURL y Postman.

### Control de Acceso Basado en Roles (RBAC)
Middleware flexible y reutilizable `authorize(...allowedRoles)` (`src/middlewares/authorization.js`):
- `authorize('admin')`: Solo permite solicitudes de usuarios con rol `admin`.
- `authorize('user')`: Solo usuarios estándar.
- `authorize('user', 'admin')`: Permite ambos roles.

**Matriz de permisos:**
| Acción | Endpoint | Rol Requerido |
|---|---|---|
| Listar catálogo | `GET /api/products` | Público / Todos |
| Ver detalle de producto | `GET /api/products/:id` | Público / Todos |
| Crear producto | `POST /api/products` | `admin` |
| Actualizar producto | `PUT /api/products/:id` | `admin` |
| Eliminar producto | `DELETE /api/products/:id` | `admin` |
| Operar carrito propio | `GET, POST, PUT, DELETE /api/carts/:cid...` | Propietario (`user`) |
| Realizar compra (Checkout) | `POST /api/carts/:cid/purchase` | Propietario (`user`) |
| Ver mis tickets | `GET /api/tickets/mine` | Propietario (`user`) |
| Ver un ticket | `GET /api/tickets/:id` | Propietario o `admin` |
| Listar todos los tickets | `GET /api/tickets` | `admin` |

---

## 10. Módulos del Sistema

### Usuarios
- Campos: `first_name`, `last_name`, `email` (único, lowercase), `age` (entero >= 18), `password` (hasheado con bcrypt, `select: false`), `role` (`user` o `admin`), `cart` (ObjectId ref `Cart`).
- Métodos: `comparePassword(candidatePassword)` para comparar contraseñas sin exponer el hash.

### Productos
- Campos: `title`, `description`, `code` (único), `price` (número >= 0), `status` (booleano), `stock` (entero >= 0, sin decimales ni negativos), `category`, `thumbnails`.

### Carritos y Control de Propiedad
- Cada usuario registrado posee un único carrito asociado a su `_id`.
- En todas las operaciones de carritos (`/api/carts/:cid/...`), el middleware y servicio verifican que `cart.user.toString() === req.user._id.toString()`.
- Un usuario **nunca puede ver, agregar productos ni comprar con el carrito de otro usuario** (retorna HTTP 403 Forbidden).

### Proceso de Compra Atómica y Generación de Tickets
El endpoint `POST /api/carts/:cid/purchase` ejecuta la siguiente lógica transaccional:
1. Valida que el carrito pertenezca al usuario solicitante (`req.user._id`).
2. Verifica que el carrito no se encuentre vacío.
3. Para cada producto en el carrito, consulta su información real en MongoDB (se ignoran precios o datos enviados por el cliente).
4. Aplica una **operación atómica de descuento de stock en MongoDB**:
   ```javascript
   ProductModel.findOneAndUpdate(
     { _id: productId, stock: { $gte: quantity } },
     { $inc: { stock: -quantity } },
     { new: true }
   )
   ```
5. **Compra Completa**: Si todos los productos cuentan con stock suficiente, se descuenta su inventario, se crea el Ticket, se vacía el carrito y se responde HTTP 200 con `status: "complete"`.
6. **Compra Parcial**: Si algunos productos tienen stock y otros no, los productos con stock se descuentan y se facturan en el Ticket. Los productos sin stock permanecen dentro del carrito y se devuelven en el arreglo `rejected` con el motivo. Se responde HTTP 200 con `status: "partial"`.
7. **Sin Stock (Conflicto)**: Si **ningún producto** del carrito pudo ser comprado, **no se genera ticket**, se conserva intacto el carrito y se devuelve **HTTP 409 Conflict**.

### Tickets de Compra
- Registra `code` único (`TCK-<timestamp>-<hash>`), `purchase_datetime`, `amount` (total acumulado), `purchaser` (`req.user._id`) y el array `products` con **precios unitarios históricos** al momento exacto de la compra.

### Recuperación de Contraseña con Nodemailer
Flujo criptográficamente seguro:
1. `POST /api/sessions/forgot-password`: Recibe el email. Si existe, genera un token aleatorio con `crypto.randomBytes(32)` y almacena únicamente su **hash SHA-256** con expiración a **60 minutos**.
2. Envía un correo con diseño HTML, botón y enlace a `${FRONTEND_URL}/reset-password?token=${token}`.
3. Por seguridad, **siempre responde el mismo mensaje** tanto si el email existe como si no:
   > *"Si el email existe, recibirás instrucciones para restablecer tu contraseña"*
4. `POST /api/sessions/reset-password/:token`:
   - Valida que el token exista (comparando hashes SHA-256).
   - Valida que no haya expirado (< 60 minutos).
   - Valida que no haya sido utilizado previamente (`resetPasswordUsedAt`).
   - Valida que la nueva contraseña sea **diferente** a la anterior.
   - Hashea la nueva contraseña con bcrypt e invalida el token registrando la fecha de uso.

---

## 11. Manejo Centralizado de Errores

El middleware `errorHandler` (`src/middlewares/errorHandler.js`) centraliza y estandariza todas las excepciones:

- `200`: Éxito.
- `201`: Recurso creado.
- `400 Bad Request`: Datos de entrada inválidos, tipos erróneos, errores de `express-validator` o `Mongoose ValidationError` / `CastError`.
- `401 Unauthorized`: Token ausente, inválido, expirado o credenciales de login incorrectas.
- `403 Forbidden`: Rol insuficiente o intento de acceso a un carrito ajeno.
- `404 Not Found`: Recurso, ruta o ID no encontrado en la base de datos.
- `409 Conflict`: Clave duplicada en MongoDB (error 11000, ej: email o código de producto duplicado) o compra sin stock disponible.
- `500 Internal Server Error`: Errores no controlados; nunca expone stack traces ni credenciales internas.

---

## 12. Tabla Resumen de Endpoints de la API

| Método | Endpoint | Autenticación | Rol / Permiso | Descripción |
|---|---|---|---|---|
| **GET** | `/api/health` | No | Público | Verificación de salud y estado de la API |
| **POST** | `/api/sessions/register` | No | Público | Registro de usuario estándar (`role: user`) |
| **POST** | `/api/sessions/login` | No | Público | Login con JWT en Cookie httpOnly y Bearer |
| **POST** | `/api/sessions/logout` | No | Público | Cierre de sesión y limpieza de cookie |
| **GET** | `/api/sessions/current` | JWT | `user` / `admin` | Devuelve el CurrentUserDTO seguro |
| **POST** | `/api/sessions/forgot-password` | No | Público | Solicita enlace de recuperación de clave |
| **POST** | `/api/sessions/reset-password/:token`| No | Público | Restablece contraseña validando token |
| **GET** | `/api/products` | No | Público | Listar productos con filtros y paginación |
| **GET** | `/api/products/:id` | No | Público | Obtener producto por ObjectId |
| **POST** | `/api/products` | JWT | `admin` | Crear nuevo producto en el catálogo |
| **PUT** | `/api/products/:id` | JWT | `admin` | Actualizar producto existente |
| **DELETE**| `/api/products/:id` | JWT | `admin` | Eliminar producto del catálogo |
| **GET** | `/api/carts/:cid` | JWT | Propietario | Consultar el carrito del usuario |
| **POST** | `/api/carts/:cid/product/:pid` | JWT | Propietario | Agregar o incrementar producto en carrito |
| **PUT** | `/api/carts/:cid/product/:pid` | JWT | Propietario | Actualizar cantidad de producto en carrito |
| **DELETE**| `/api/carts/:cid/product/:pid` | JWT | Propietario | Eliminar un producto del carrito |
| **DELETE**| `/api/carts/:cid` | JWT | Propietario | Vaciar completamente el carrito |
| **POST** | `/api/carts/:cid/purchase` | JWT | Propietario | Checkout y compra atómica con ticket |
| **GET** | `/api/tickets/mine` | JWT | Propietario | Listar tickets de compra del usuario actual |
| **GET** | `/api/tickets` | JWT | `admin` | Listar todos los tickets del sistema |
| **GET** | `/api/tickets/:id` | JWT | Propietario / `admin` | Consultar ticket específico por ObjectId |

---

## 13. Pruebas Automatizadas y Manuales

### Pruebas Automatizadas (`npm test`)
La suite de pruebas en `tests/api.test.js` utiliza el runner nativo de Node.js (`node --test`), `node:assert/strict`, `supertest` y **`mongodb-memory-server`**. Esto permite ejecutar la totalidad de los tests con una base de datos MongoDB real en memoria sin requerir configuraciones previas ni un daemon externo de MongoDB activo.

Para ejecutar los tests:
```bash
npm test
```

**Escenarios cubiertos en la suite:**
- Health check operativo.
- Registro público forzado a rol `user` con creación automática de carrito único.
- Login exitoso con emisión de JWT y cookie httpOnly.
- Login rechazado ante contraseñas incorrectas (401).
- Current user DTO seguro sin passwords, tokens ni hashes.
- Extracción de autenticación tanto por cookie como por header Bearer.
- Logout correcto.
- Restricción de creación y eliminación de productos para usuarios estándar (403).
- Creación de productos permitida para administradores (201).
- Validación de stock negativo o decimal rechazada (400).
- Agregado, actualización y eliminación de items en el carrito propio.
- Rechazo estricto de acceso y manipulación de carritos ajenos (403).
- Respuesta idéntica y segura en `forgot-password`.
- Rechazo de token de restablecimiento inválido (400).
- Rechazo de token de restablecimiento expirado (400).
- Rechazo de token de restablecimiento reutilizado (400).
- Rechazo de reseteo con la misma contraseña anterior (400).
- Restablecimiento exitoso e invalidación de token.
- Compra parcial: productos con stock se facturan, productos sin stock permanecen en el carrito y stock se descuenta atómicamente.
- Compra rechazada con HTTP 409 cuando ningún producto tiene stock disponible.
- Compra completa: vaciado de carrito y emisión de Ticket con precio histórico.
- Consulta de mis tickets (`/mine`) permitida al comprador.
- Acceso denegado a listado global de tickets para usuarios estándar (403) y permitido para administradores (200).

### Pruebas Manuales con cURL
En `tests/manual-tests.md` se provee una guía paso a paso con los comandos cURL completos para cada flujo de la aplicación.

---

## 14. Consideraciones de Seguridad y Buenas Prácticas (.env y Git)

- **Archivos `.env` en Git**: El archivo `.env` se encuentra explícitamente listado en `.gitignore`. Nunca se deben comitear credenciales reales, claves privadas ni contraseñas de producción en repositorios públicos o privados.
- **Plantilla `.env.example`**: Siempre se debe mantener actualizada con variables de muestra para facilitar la incorporación de nuevos desarrolladores o despliegues en CI/CD.
- **Protección contra inyecciones y tipos**: Se utilizan esquemas de Mongoose con tipos validados, validadores de `express-validator` y operaciones de actualización con `$inc` y operadores atómicos.
- **Sanitización de respuestas**: El modelo `User` cuenta con transformaciones `toJSON` y el DTO `CurrentUserDTO` garantiza que ningún dato sensible se filtre a través de la API.
