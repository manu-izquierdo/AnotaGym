<div align="center">

# 🏋️ AnotaGym

### Tu Agenda para el Gym · Your Smart Gym Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-orange)](https://firebase.google.com)
[![PWA](https://img.shields.io/badge/Type-PWA-blue)](https://web.dev/progressive-web-apps/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff)](https://vitejs.dev)

**🔗 App en producción / Live app: [anotagym.vercel.app](https://anotagym.vercel.app)**

> **Español** · [English below ↓](#english-version)

</div>

---

## 🇪🇸 Versión Española

### ¿Qué es AnotaGym?

**AnotaGym** es una aplicación web progresiva (PWA) gratuita para el registro y seguimiento de entrenamientos en el gimnasio. Diseñada mobile-first, funciona tanto online como offline y sincroniza tus datos en todos tus dispositivos.

A diferencia de apps como Hevy, Caliber o Strong — AnotaGym es completamente **gratuita, sin anuncios y con tu propio backup**.

### ✨ Características principales

| Feature | Descripción |
|---------|-------------|
| 🔐 **Autenticación** | Email + contraseña, Google Sign-In y Modo Invitado |
| 📋 **Plantillas de rutina** | Crea rutinas con hasta 15 ejercicios |
| 🏷️ **Tipos de serie** | Normal, Top Set, Back-off, Drop Set, Rest-Pause, Myo-Rep, Calentamiento, Al Fallo |
| ✅ **Check de series** | Marca cada serie como completada con indicador visual |
| 📈 **1RM en tiempo real** | Estimaciones de 1RM, 5RM y 8RM por serie (fórmula Epley) |
| 📊 **Historial completo** | Timeline de sesiones, calendario mensual y gráficas de volumen |
| 📉 **Progresión por ejercicio** | Gráfica interactiva por ejercicio: peso máximo, 1RM estimado y volumen, con récords, rangos de tiempo y detalle de cada sesión al tocar un punto |
| ⚖️ **Métricas corporales** | Registro y gráfica de evolución de peso corporal |
| 🌍 **Offline-first** | Funciona sin conexión gracias a IndexedDB |
| ☁️ **Sync en la nube** | Firestore sincroniza en tiempo real entre dispositivos |
| 💾 **Export/Import JSON** | Copia de seguridad completa de tus datos |
| 🎨 **Temas y colores** | Modo oscuro/claro + 8 paletas de color de acento |
| 👑 **Panel de admin** | Gestión visual del catálogo global: editar, ocultar y añadir ejercicios con foto |
| 📝 **Notas por ejercicio** | Apunta sensaciones y técnica en cada ejercicio de la sesión |
| 📚 **Base de Datos Masiva** | 80 ejercicios base en español (79 con foto) + 870+ ejercicios open-source con imágenes servidas desde CDN global (jsDelivr) — cero configuración |
| ⏱️ **Timer de descanso** | Timer automático al completar una serie, con feedback háptico (desactivable) |
| 🔗 **Compartir rutinas** | Genera un enlace para que cualquiera importe tu rutina con un toque |
| 🔍 **Buscador Inteligente** | Filtrado en tiempo real en el creador de rutinas. |
| 🛡️ **Seguridad Anti-bots** | Firebase App Check con reCAPTCHA v3 |
| 🧹 **Mantenimiento auto** | Script en GitHub Actions para limpieza de invitados |

### 📱 ¿PWA o App nativa?

AnotaGym es una **Progressive Web App**. Esto significa que:
- En **iOS**: Abre Safari → visita la URL → botón "Compartir" → "Añadir a pantalla de inicio" → queda como icono de app
- En **Android**: Chrome te ofrecerá automáticamente instalarla
- Sin App Store, sin Play Store, actualización automática

### 🛠️ Stack tecnológico

```
Frontend:   React 18 + Vite 5 + Tailwind CSS 3
Auth:       Firebase Authentication
Database:   Cloud Firestore (NoSQL, tiempo real)
Offline:    IndexedDB (via Firebase Persistence)
PWA:        vite-plugin-pwa (Workbox)
Icons:      Lucide React
Fonts:      Inter (Google Fonts)
Deploy:     Firebase Hosting / Vercel
```

### 🚀 Instalación local

#### 1. Clonar el repositorio
```bash
git clone https://github.com/manu-izquierdo/AnotaGym.git
cd AnotaGym
```

#### 2. Instalar dependencias
```bash
npm install
```

#### 3. Configurar Firebase

Crea un proyecto en [console.firebase.google.com](https://console.firebase.google.com):

1. Activa **Authentication** → habilita Email/Contraseña y Google
2. Activa **Firestore** → empieza en modo de producción
3. Copia las credenciales del proyecto

Crea el archivo `.env.local` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> ⚠️ **NUNCA subas `.env.local` a GitHub.** Ya está en `.gitignore`.

#### 4. Reglas de Firestore

Las reglas completas están en [`firestore.rules`](firestore.rules). Cópialas en la consola
de Firebase → Firestore Database → Reglas → Publicar (o `firebase deploy --only firestore:rules`).

> 🔒 **Importante**: usa siempre el archivo del repo. Además de aislar los datos de cada
> usuario, impide que un usuario se auto-asigne el rol `admin` editando su propio perfil
> (el campo `role` es inmutable desde el cliente; se concede a mano en la consola).

#### 5. Arrancar en modo desarrollo
```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`

### 📦 Build de producción

```bash
npm run build
```

La carpeta `dist/` contendrá la app lista para desplegar.

### 🌐 Despliegue

#### Opción A: Vercel (recomendado — gratis, automático)

```bash
npm install -g vercel
vercel login
vercel --prod
```

O conecta tu repositorio GitHub a [vercel.com](https://vercel.com) — cada push a `main` desplegará automáticamente.

#### Opción B: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # dist como directorio público, SPA: sí
firebase deploy
```

### 👑 Guía de administración del catálogo

El catálogo de ejercicios se compone de **tres capas** que la app fusiona en tiempo real
(`src/hooks/useFirestoreData.js`):

| Capa | Dónde vive | Quién la ve | Quién la edita |
|------|-----------|-------------|----------------|
| **Catálogo base** | `src/data/exerciseLibrary.js` (80, español) + `src/data/extendedLibrary.js` (870+, inglés) — dentro del bundle JS | Todos | Solo por código (PR al repo) |
| **Catálogo global** | Colección `/globalExercises` en Firestore | Todos | Solo admins, desde la app |
| **Ejercicios privados** | `/users/{uid}/privateExercises` | Solo su dueño | Su dueño |

**Regla de oro del merge:** un documento de `/globalExercises` con el **mismo `id`** que un
ejercicio del catálogo base lo **sobreescribe para todos** (override). Así el admin puede
corregir el nombre, grupo, equipamiento o foto de cualquier ejercicio sin tocar código.

**Cómo gestionar ejercicios como admin (desde la app):**

1. Entra con tu cuenta admin → pestaña **Ajustes** → tarjeta **Administración** → *Abrir panel de ejercicios*
2. Desde el panel puedes:
   - 🔍 Buscar y filtrar (grupo, material, **sin foto**, ocultos) — toca las tarjetas de stats para filtrar
   - ✏️ **Editar** cualquier ejercicio (con preview de la imagen en vivo)
   - 🙈 **Ocultar** ejercicios del catálogo base para todos (sin borrar el historial de nadie)
   - ➕ **Añadir** ejercicios globales nuevos con foto
   - 🗑️ **Eliminar** documentos globales (si es un override, vuelve a la versión original del bundle)

**Cómo se asigna el rol admin** (solo se hace una vez, a mano):
Firebase Console → Firestore → `users/{uid}/profile/data` → editar campo `role` → `admin`.
Las reglas de seguridad impiden que nadie se lo asigne desde el cliente.

**Fotos de ejercicios:** el proyecto usa [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
(dominio público) servido vía jsDelivr. Para un ejercicio nuevo, busca su carpeta y usa:
`https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/<NOMBRE>/0.jpg`

### 🗄️ Estructura de datos en Firestore

```
/users/{uid}/profile/data            → displayName, photoURL, role ('user'|'admin')
/users/{uid}/workoutData/main        → rutinas, sesión activa, historial, métricas, preferencias
/users/{uid}/privateExercises/{id}   → ejercicios personalizados del usuario
/globalExercises/{id}                → catálogo global (overrides, nuevos y tombstones {hidden:true})
```

### 🏗️ Estructura del proyecto

```
anotagym/
├── public/                     # Assets estáticos (iconos PWA)
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   └── LoginView.jsx   # Pantalla de login/registro
│   │   ├── Dashboard/
│   │   │   ├── SplitView.jsx   # Lista de rutinas (home)
│   │   │   └── TemplateEditor.jsx  # Editor de plantillas con tipos de serie
│   │   ├── History/
│   │   │   └── HistoryView.jsx # Historial, gráficas, métricas
│   │   ├── Layout/
│   │   │   └── MobileAppShell.jsx  # Shell de navegación móvil
│   │   ├── Admin/
│   │   │   └── AdminExercisesView.jsx  # Panel de gestión del catálogo global
│   │   ├── Profile/
│   │   │   ├── ProfileView.jsx # Perfil y métricas corporales
│   │   │   └── SettingsView.jsx    # Configuración, ejercicios, export
│   │   ├── Tracker/
│   │   │   ├── SetLogger.jsx   # Logger de series activo (entrenamiento)
│   │   │   └── RestTimerPill.jsx   # Timer de descanso flotante
│   │   └── UI/
│   │       ├── Card.jsx        # Componentes UI reutilizables
│   │       └── ErrorBoundary.jsx   # Recuperación ante crashes
│   ├── contexts/
│   │   └── AuthContext.jsx     # Context de autenticación Firebase
│   ├── data/
│   │   ├── exerciseLibrary.js  # 80 ejercicios base en español (79 con foto)
│   │   ├── extendedLibrary.js  # 870+ ejercicios open-source (imágenes vía jsDelivr CDN)
│   │   └── muscleImages.js     # Imágenes de fallback por grupo muscular
│   ├── hooks/
│   │   └── useFirestoreData.js # Hook principal: sync Firestore ↔ estado
│   ├── utils/                  # Utilidades (helpers)
│   ├── firebase.js             # Inicialización Firebase
│   ├── App.jsx                 # Componente raíz, manejo de estado global
│   ├── main.jsx                # Entry point React
│   └── index.css               # Estilos globales
├── .env.example                # Plantilla de variables de entorno
├── .env.local                  # TUS credenciales (no subir a git)
├── firestore.rules             # Reglas de seguridad de Firestore
├── .gitignore
├── index.html                  # HTML con SEO meta tags
├── package.json
├── tailwind.config.js
└── vite.config.js              # Config Vite + PWA manifest
```

### 🌿 Flujo de trabajo Git recomendado

```bash
# Ramas principales
main      → producción (protegida)
develop   → integración continua

# Crear nueva feature
git checkout develop
git checkout -b feature/nombre-feature
# ... trabaja ...
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/nombre-feature
# → crea Pull Request a develop
# → cuando está listo, merge develop → main
```

#### Convención de commits

```
feat:     nueva funcionalidad
fix:      corrección de bug
docs:     cambios en documentación
style:    cambios de estilo sin lógica
refactor: refactorización de código
chore:    tareas de mantenimiento
```

### 💾 Backup y seguridad de datos

**¿Dónde están tus datos?**
- **Cloud Firestore** (Google) — base de datos principal, sincronización en tiempo real
- **IndexedDB** del navegador — copia local para modo offline
- **Export JSON** — botón en Configuración → descarga todos tus datos como archivo `.json`

**Estrategia de backup recomendada:**
1. Export mensual desde la app (Configuración → Exportar datos)
2. Guardar el JSON en Google Drive / Dropbox
3. El código siempre respaldado en GitHub

### 🌐 Dominio — Dónde comprar y por qué

#### Comparativa de registradores recomendados

| Registrador | `.com` | `.app` | `.es` | Privacidad WHOIS | Por qué |
|-------------|--------|--------|-------|-----------------|---------|
| **[Porkbun](https://porkbun.com)** | ~8€/año | ~12€/año | ~6€/año | ✅ Gratis | El más barato, muy recomendado |
| **[Namecheap](https://namecheap.com)** | ~10€/año | ~14€/año | ~8€/año | ✅ Gratis | Interfaz clara, buen soporte |
| **[Cloudflare Registrar](https://cloudflare.com/registrar)** | ~8€/año | — | — | ✅ Gratis | Sin markup, precio de coste |
| **[Google Domains](https://domains.google)** | ~12€/año | ~12€/año | — | ✅ Gratis | Integrado con Firebase |

**Recomendación**: `anotagym.app` (`.app` es perfecto para PWAs) en **Porkbun** (~12€/año). El dominio `.app` fuerza HTTPS por protocolo, lo que es ideal para una PWA.

**Alternativa económica**: `anotagym.es` si solo te importa el mercado español.

Una vez tengas el dominio, en Vercel o Firebase Hosting puedes conectarlo gratis en 5 minutos (SSL incluido automáticamente).

### 💰 Costes reales (escenario gratuito completo)

| Servicio | Plan | Coste mensual |
|----------|------|--------------|
| Firebase Auth | Spark (gratis) | 0€ |
| Firestore | Spark (50K reads/día, 20K writes/día) | 0€ |
| Firebase Hosting | Spark (10GB) | 0€ |
| GitHub | Free | 0€ |
| Vercel | Hobby | 0€ |
| **Dominio** (opcional) | — | ~1€/mes (12€/año) |
| **TOTAL** | | **0€ o ~1€/mes** |

> El plan gratuito de Firebase soporta cómodamente entre 500 y 1.000 usuarios activos sin pagar nada.

### 🗺️ Roadmap

- [x] Autenticación (email + Google)
- [x] Plantillas de rutina con editor completo
- [x] Logger de series con estimaciones de 1RM
- [x] Tipos de serie (topset, dropset, rest-pause, myo-rep, etc.)
- [x] Check visual de series completadas + barra de progreso
- [x] Historial con gráficas de volumen y peso corporal
- [x] Métricas corporales
- [x] Sincronización Firestore + offline IndexedDB
- [x] Export / Import JSON
- [x] Temas y paletas de color
- [x] PWA instalable (iOS + Android)
- [x] Modo Invitado (Anonymous Auth)
- [x] Firebase App Check (reCAPTCHA)
- [x] Script automático GitHub Actions para limpieza de invitados
- [x] Timer de descanso entre series (con feedback háptico)
- [x] Compartir rutinas por enlace
- [x] Notas por ejercicio en la sesión
- [x] Panel de administración visual del catálogo global
- [x] Reglas de Firestore endurecidas (rol admin inmutable desde el cliente)
- [x] Estadísticas por ejercicio (curva de progresión con peso máx, 1RM estimado y volumen)
- [ ] Quick Log (sesión libre sin plantilla)
- [ ] Notificaciones push
- [ ] Historial de sesiones en subcolección (hoy vive en un único documento)

### 📄 Licencia

MIT © 2024-2026 — Manu Izquierdo · Ver [LICENSE](LICENSE)

---

---

<div id="english-version"></div>

## 🇬🇧 English Version

### What is AnotaGym?

**AnotaGym** (*"Write it down, Gym"* in Spanish) is a free Progressive Web App (PWA) for gym workout tracking. Built mobile-first, it works both online and offline, syncing your data across all your devices via Firebase.

Unlike Hevy, Caliber or Strong — AnotaGym is completely **free, ad-free and gives you full data ownership**.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Email/password, Google Sign-In & Guest Mode |
| 📋 **Routine Templates** | Create routines with up to 15 exercises |
| 🏷️ **Set Types** | Normal, Top Set, Back-off, Drop Set, Rest-Pause, Myo-Rep, Warm-up, To Failure |
| ✅ **Set Completion Check** | Mark each set as done with visual green highlight |
| 📈 **Real-time 1RM** | 1RM, 5RM and 8RM estimates per set (Epley formula) + delta vs previous session |
| 📊 **Full History** | Session timeline, monthly calendar heatmap, volume charts |
| 📉 **Per-exercise progression** | Interactive chart per exercise: max weight, estimated 1RM and volume, with PRs, time ranges and tap-to-inspect session detail |
| ⚖️ **Body Metrics** | Track and chart bodyweight over time |
| 🌍 **Offline-first** | Works without internet via IndexedDB |
| ☁️ **Cloud sync** | Firestore real-time sync across devices |
| 💾 **Export/Import JSON** | Full data backup at any time |
| 🎨 **Themes** | Dark/light mode + 8 accent color palettes |
| 👑 **Admin role** | Global exercise catalog managed by admin |
| 🛡️ **Security** | Firebase App Check with reCAPTCHA v3 |
| 🧹 **Auto Cleanup** | GitHub Actions cron job for guest accounts cleanup |

### 🛠️ Tech Stack

```
Frontend:   React 18 + Vite 5 + Tailwind CSS 3
Auth:       Firebase Authentication
Database:   Cloud Firestore (NoSQL, real-time)
Offline:    IndexedDB (via Firebase Persistence)
PWA:        vite-plugin-pwa (Workbox service worker)
Icons:      Lucide React
Fonts:      Inter (Google Fonts)
Deploy:     Firebase Hosting / Vercel
```

### 🚀 Local Setup

#### 1. Clone the repo
```bash
git clone https://github.com/manu-izquierdo/AnotaGym.git
cd AnotaGym
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Firebase Setup

Create a project at [console.firebase.google.com](https://console.firebase.google.com):

1. Enable **Authentication** → activate Email/Password and Google
2. Enable **Firestore** → start in production mode
3. Copy the project credentials

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> ⚠️ **Never commit `.env.local` to GitHub.** It's already in `.gitignore`.

#### 4. Firestore Security Rules

Full rules live in [`firestore.rules`](firestore.rules). Paste them in Firebase Console →
Firestore Database → Rules → Publish (or `firebase deploy --only firestore:rules`).

> 🔒 Always use the repo file: besides isolating each user's data, it prevents
> privilege escalation (the `role` field is immutable from the client — admin is
> granted manually in the console).

#### 5. Start dev server
```bash
npm run dev
```

### 🌐 Deployment

#### Vercel (recommended — free, auto-deploy)
Connect your GitHub repo at [vercel.com](https://vercel.com). Every push to `main` deploys automatically.

#### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### 🗺️ Roadmap

- [x] Authentication (email + Google)
- [x] Routine templates with full editor
- [x] Set logger with real-time 1RM estimates
- [x] Set types (topset, dropset, rest-pause, myo-rep, etc.)
- [x] Set completion check + progress bar
- [x] History with volume charts and bodyweight chart
- [x] Cloud sync (Firestore) + offline (IndexedDB)
- [x] Full data export / import (JSON)
- [x] Themes and color palettes
- [x] Installable PWA (iOS + Android)
- [x] Guest Mode (Anonymous Auth)
- [x] Firebase App Check (reCAPTCHA)
- [x] Automated guest cleanup via GitHub Actions
- [x] Rest timer between sets (with haptic feedback)
- [x] Share routines via link
- [x] Per-exercise notes in session
- [x] Visual admin panel for the global exercise catalog
- [x] Hardened Firestore rules (client-immutable admin role)
- [x] Exercise progression chart (max weight, estimated 1RM, volume)
- [ ] Free-form Quick Log session
- [ ] Push notifications
- [ ] Move session history to a subcollection (currently a single document)

### 📄 License

MIT © 2024-2026 — Manu Izquierdo · See [LICENSE](LICENSE)
