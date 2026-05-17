# 💍 Áureo — Sistema de Precios para Joyería

MVP para calcular automáticamente precios de piezas de oro basado en el precio del mercado.

---

## ⚡ Inicio rápido (< 5 minutos)

### Requisitos

- Node.js 18+ instalado
- npm o yarn

### Instalación y ejecución

```bash
# 1. Entrar al directorio
cd joyeria-mvp

# 2. Instalar dependencias
npm install

# 3. Levantar el servidor de desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:3000
```

¡Listo! No necesitas configurar ninguna base de datos. El sistema crea un archivo `data/joyeria.db` automáticamente.

---

## 📐 Fórmula de Cálculo

```
pureza     = kilataje / 24
             (24k=100%, 18k=75%, 14k=58.5%, 10k=41.7%)

valor_oro  = gramos × pureza × precio_oro_actual

subtotal   = valor_oro + mano_obra + extras

precio_final = subtotal × (1 + margen% / 100)
```

---

## 🛠️ Funcionalidades

| Feature | Descripción |
|---------|------------|
| ✅ Panel precio del oro | Muestra el precio actual y cuándo fue actualizado |
| ✅ Actualización manual | El admin puede cambiar el precio manualmente |
| ✅ Sincronización mock | Botón para simular fetch desde API externa |
| ✅ Cron semanal | Actualización automática cada domingo a medianoche |
| ✅ CRUD de productos | Crear, editar, eliminar piezas |
| ✅ Preview en tiempo real | El precio se calcula mientras llenas el formulario |
| ✅ Recálculo automático | Todos los precios se actualizan al cambiar el oro |

---

## 🏗️ Estructura del proyecto

```
joyeria-mvp/
├── app/
│   ├── api/
│   │   ├── gold-price/
│   │   │   └── route.ts       ← GET/PUT precio del oro
│   │   └── products/
│   │       ├── route.ts       ← GET todos / POST nuevo
│   │       └── [id]/
│   │           └── route.ts   ← GET / PUT / DELETE por ID
│   ├── lib/
│   │   ├── db.ts              ← SQLite: esquema y queries
│   │   ├── pricing.ts         ← Lógica de cálculo centralizada
│   │   └── cron.ts            ← Job semanal de actualización
│   ├── globals.css            ← Estilos del sistema
│   ├── layout.tsx             ← Shell de la aplicación
│   └── page.tsx               ← Dashboard principal
├── data/
│   └── joyeria.db             ← Base de datos SQLite (auto-creada)
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 🔌 API Endpoints

### Precio del Oro

```
GET  /api/gold-price
→ { price_per_gram: 96.5, updated_at: "..." }

PUT  /api/gold-price
Body: { price_per_gram: 98.50 }     ← Override manual
Body: { refresh: true }              ← Fetch desde API mock
```

### Productos

```
GET    /api/products            ← Lista todos
POST   /api/products            ← Crea uno nuevo
GET    /api/products/:id        ← Obtiene uno
PUT    /api/products/:id        ← Actualiza
DELETE /api/products/:id        ← Elimina
```

---

## 🔧 Conectar a una API real de oro

Edita `app/lib/cron.ts`, función `fetchGoldPriceFromAPI()`:

```typescript
// Ejemplo con goldapi.io
async function fetchGoldPriceFromAPI(): Promise<number> {
  const res = await fetch('https://www.goldapi.io/api/XAU/USD', {
    headers: { 'x-access-token': 'TU_API_KEY' }
  })
  const data = await res.json()
  // El precio viene en oz troy, convertir a gramos: / 31.1035
  return data.price / 31.1035
}
```

---

## 💡 Notas del MVP

- El precio del oro se inicializa en **$95 USD/gramo** (≈ precio real actual)
- El cron corre **cada domingo a medianoche** (configurable en `cron.ts`)
- La base de datos SQLite se crea sola en `./data/joyeria.db`
- Todos los precios están en **USD**
