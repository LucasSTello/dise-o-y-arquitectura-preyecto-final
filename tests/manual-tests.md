# Guía Completa de Pruebas Manuales con cURL - ecommerce-backend

Esta guía contiene la secuencia completa de comandos cURL para validar manualmente todos los endpoints, reglas de negocio, roles de seguridad y flujos transaccionales del backend.

Base URL por defecto: `http://localhost:8080`

---

## 1. Verificación de Salud (Health Check)

```bash
curl -X GET http://localhost:8080/api/health \
  -H "Accept: application/json"
```

**Respuesta esperada (HTTP 200):**
```json
{
  "status": "success",
  "message": "Ecommerce Backend API operativa",
  "timestamp": "2026-10-06T..."
}
```

---

## 2. Autenticación y Sesiones

### 2.1 Registro de Usuario Estándar (`role: user`)
> Nota: El registro público siempre asigna rol `user`. Aunque un cliente intente enviar `role: "admin"`, será ignorado.

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan.perez@example.com",
    "age": 25,
    "password": "Password123!"
  }'
```

**Respuesta esperada (HTTP 201):**
```json
{
  "status": "success",
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan.perez@example.com",
    "age": 25,
    "role": "user"
  }
}
```

### 2.2 Inicio de Sesión de Usuario (Login)
Guarda la cookie en un archivo `cookies.txt`:

```bash
curl -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "juan.perez@example.com",
    "password": "Password123!"
  }'
```

**Respuesta esperada (HTTP 200):**
Retorna el token JWT en el body y setea la cookie `jwt` en `Set-Cookie`.

### 2.3 Inicio de Sesión Fallido (Credenciales inválidas)

```bash
curl -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@example.com",
    "password": "ContraseñaIncorrecta"
  }'
```

**Respuesta esperada (HTTP 401):**
```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

### 2.4 Obtener Usuario Actual (`GET /api/sessions/current`)
#### Usando Cookie:
```bash
curl -X GET http://localhost:8080/api/sessions/current \
  -b cookies.txt
```

#### Usando Authorization Bearer:
```bash
curl -X GET http://localhost:8080/api/sessions/current \
  -H "Authorization: Bearer <TOKEN_JWT_AQUI>"
```

**Respuesta esperada (HTTP 200):**
```json
{
  "status": "success",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan.perez@example.com",
    "age": 25,
    "role": "user"
  }
}
```
*No incluye contraseñas, hashes, ni tokens de reseteo.*

### 2.5 Cierre de Sesión (Logout)

```bash
curl -X POST http://localhost:8080/api/sessions/logout \
  -b cookies.txt \
  -c cookies.txt
```

---

## 3. Catálogo de Productos

### 3.1 Listar Productos (Público)

```bash
curl -X GET "http://localhost:8080/api/products?limit=5&page=1"
```

### 3.2 Crear Producto con Rol USER (Esperado: 403 Forbidden)

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_USER>" \
  -d '{
    "title": "Teclado Mecánico",
    "description": "Switch Red RGB",
    "code": "PROD-KB-01",
    "price": 85.50,
    "stock": 20,
    "category": "Periféricos"
  }'
```

**Respuesta esperada (HTTP 403):**
```json
{
  "status": "error",
  "message": "Acceso prohibido: se requiere uno de los siguientes roles [admin] pero tu rol es 'user'"
}
```

### 3.3 Crear Producto con Rol ADMIN (Esperado: 201 Created)

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -d '{
    "title": "Teclado Mecánico RGB",
    "description": "Switch Red silencioso",
    "code": "PROD-KB-01",
    "price": 85.50,
    "stock": 15,
    "category": "Periféricos",
    "thumbnails": ["https://ejemplo.com/teclado.jpg"]
  }'
```

### 3.4 Validación de Producto (Rechazo de stock negativo o decimal)

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -d '{
    "title": "Producto Inválido",
    "description": "Prueba error",
    "code": "PROD-INV-01",
    "price": -10,
    "stock": 2.5,
    "category": "Pruebas"
  }'
```

**Respuesta esperada (HTTP 400):**
Muestra errores indicando precio no negativo y stock entero no negativo.

---

## 4. Gestión de Carritos y Control de Propiedad

### 4.1 Obtener Carrito Propio

```bash
curl -X GET http://localhost:8080/api/carts/<CART_ID> \
  -H "Authorization: Bearer <TOKEN_USER_1>"
```

### 4.2 Intentar Acceder al Carrito de Otro Usuario (Esperado: 403 Forbidden)

```bash
curl -X GET http://localhost:8080/api/carts/<CART_ID_DE_USER_2> \
  -H "Authorization: Bearer <TOKEN_USER_1>"
```

**Respuesta esperada (HTTP 403):**
```json
{
  "status": "error",
  "message": "Acceso denegado: no puedes interactuar con el carrito de otro usuario"
}
```

### 4.3 Agregar Producto al Carrito Propio

```bash
curl -X POST http://localhost:8080/api/carts/<CART_ID>/product/<PRODUCT_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_USER_1>" \
  -d '{
    "quantity": 2
  }'
```

### 4.4 Modificar Cantidad de Producto en el Carrito

```bash
curl -X PUT http://localhost:8080/api/carts/<CART_ID>/product/<PRODUCT_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_USER_1>" \
  -d '{
    "quantity": 5
  }'
```

### 4.5 Eliminar un Producto Específico del Carrito

```bash
curl -X DELETE http://localhost:8080/api/carts/<CART_ID>/product/<PRODUCT_ID> \
  -H "Authorization: Bearer <TOKEN_USER_1>"
```

### 4.6 Vaciar el Carrito Completo

```bash
curl -X DELETE http://localhost:8080/api/carts/<CART_ID> \
  -H "Authorization: Bearer <TOKEN_USER_1>"
```

---

## 5. Proceso de Checkout y Compra Atómica

### 5.1 Compra Completa Exitosa (Stock suficiente)

```bash
curl -X POST http://localhost:8080/api/carts/<CART_ID>/purchase \
  -H "Authorization: Bearer <TOKEN_USER>"
```

**Respuesta esperada (HTTP 200):**
```json
{
  "status": "success",
  "message": "Compra completada exitosamente",
  "ticket": {
    "code": "TCK-1728256...",
    "amount": 171.00,
    "purchaser": "64f1a2b3c4d5e6f7a8b9c0d1",
    "products": [...]
  },
  "purchased": [...],
  "rejected": [],
  "total": 171.00,
  "code": "TCK-1728256..."
}
```

### 5.2 Compra Parcial (Uno con stock y otro sin stock)
Cuando el carrito contiene producto A (stock suficiente) y producto B (stock insuficiente):
- El producto A se descuenta atómicamente y genera el ticket.
- El producto B permanece dentro del carrito y se informa en la lista `rejected`.

### 5.3 Compra Rechazada por Stock Cero (HTTP 409 Conflict)
Cuando ningún producto del carrito cuenta con stock disponible:

```bash
curl -X POST http://localhost:8080/api/carts/<CART_ID>/purchase \
  -H "Authorization: Bearer <TOKEN_USER>"
```

**Respuesta esperada (HTTP 409):**
```json
{
  "status": "error",
  "message": "No se pudo completar la compra: ningún producto cuenta con stock suficiente",
  "details": {
    "rejected": [
      {
        "product": "64f1...",
        "title": "Teclado Mecánico RGB",
        "requestedQuantity": 100,
        "availableStock": 2,
        "reason": "Stock insuficiente"
      }
    ]
  }
}
```
*El carrito conserva todos los productos y no se genera ticket.*

---

## 6. Consulta de Tickets

### 6.1 Consultar Mis Tickets (`GET /api/tickets/mine`)

```bash
curl -X GET http://localhost:8080/api/tickets/mine \
  -H "Authorization: Bearer <TOKEN_USER>"
```

### 6.2 Consultar Todos los Tickets (ADMIN)

```bash
curl -X GET http://localhost:8080/api/tickets \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

### 6.3 Usuario Normal Intentando Consultar Todos los Tickets (Esperado: 403 Forbidden)

```bash
curl -X GET http://localhost:8080/api/tickets \
  -H "Authorization: Bearer <TOKEN_USER>"
```

---

## 7. Flujo de Recuperación de Contraseña

### 7.1 Solicitud de Recuperación (`POST /api/sessions/forgot-password`)

```bash
curl -X POST http://localhost:8080/api/sessions/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@example.com"
  }'
```

**Respuesta esperada (HTTP 200 - Idéntica tanto si existe como si no):**
```json
{
  "status": "success",
  "message": "Si el email existe, recibirás instrucciones para restablecer tu contraseña"
}
```

### 7.2 Restablecer Contraseña con Token (`POST /api/sessions/reset-password/:token`)

```bash
curl -X POST http://localhost:8080/api/sessions/reset-password/<TOKEN_HEX_ENVIADO_POR_MAIL> \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NuevaPassword456!"
  }'
```

**Respuesta esperada (HTTP 200):**
```json
{
  "status": "success",
  "message": "Contraseña restablecida exitosamente"
}
```

### 7.3 Intentar Usar el Mismo Token Nuevamente (Esperado: 400 Bad Request)

```bash
curl -X POST http://localhost:8080/api/sessions/reset-password/<MISMO_TOKEN> \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "OtraPassword789!"
  }'
```

**Respuesta esperada (HTTP 400):**
```json
{
  "status": "error",
  "message": "El token de recuperación ya ha sido utilizado"
}
```

### 7.4 Intentar Restablecer con la Misma Contraseña Anterior (Esperado: 400 Bad Request)

```bash
curl -X POST http://localhost:8080/api/sessions/reset-password/<OTRO_TOKEN_VALIDO> \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NuevaPassword456!"
  }'
```

**Respuesta esperada (HTTP 400):**
```json
{
  "status": "error",
  "message": "La nueva contraseña no puede ser idéntica a la anterior"
}
```
