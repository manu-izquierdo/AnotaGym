<div align="center">

# 🏋️ AnotaGym

### Tu Agenda para el Gym · Your Smart Gym Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-orange)](https://firebase.google.com)
[![PWA](https://img.shields.io/badge/Type-PWA-blue)](https://web.dev/progressive-web-apps/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff)](https://vitejs.dev)

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
| 📊 **Historial completo** | Timeline de sesiones, calendarios y gráficos de volumen |
| ⚖️ **Métricas corporales** | Registro y gráfica de evolución de peso corporal |
| 🌍 **Offline-first** | Funciona sin conexión gracias a IndexedDB |
| ☁️ **Sync en la nube** | Firestore sincroniza en tiempo real entre dispositivos |
| 💾 **Export/Import JSON** | Copia de seguridad completa de tus datos |
| 🎨 **Temas y colores** | Modo oscuro/claro + 8 paletas de color de acento |
| 👑 **Rol admin** | Catálogo global de ejercicios gestionado por el administrador |
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
git clone https://github.com/TU_USUARIO/anotagym.git
cd anotagym
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

En la consola de Firebase → Firestore → Rules, copia estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Datos privados del usuario
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Catálogo global — solo lectura para usuarios, escritura solo admin
    match /globalExercises/{exerciseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)/profile/data).data.role == 'admin';
    }
  }
}
```

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
│   │   ├── Profile/
│   │   │   ├── ProfileView.jsx # Perfil y métricas corporales
│   │   │   └── SettingsView.jsx    # Configuración, ejercicios, export
│   │   ├── Tracker/
│   │   │   └── SetLogger.jsx   # Logger de series activo (entrenamiento)
│   │   └── UI/
│   │       └── Card.jsx        # Componentes UI reutilizables
│   ├── contexts/
│   │   └── AuthContext.jsx     # Context de autenticación Firebase
│   ├── data/
│   │   └── exerciseLibrary.js  # Catálogo de ejercicios por defecto
│   ├── hooks/
│   │   ├── useFirestoreData.js # Hook principal: sync Firestore ↔ estado
│   │   └── useLocalStorage.js  # Hook auxiliar de localStorage
│   ├── utils/                  # Utilidades (helpers)
│   ├── firebase.js             # Inicialización Firebase
│   ├── App.jsx                 # Componente raíz, manejo de estado global
│   ├── main.jsx                # Entry point React
│   └── index.css               # Estilos globales
├── .env.example                # Plantilla de variables de entorno
├── .env.local                  # TUS credenciales (no subir a git)
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
- [ ] Timer de descanso entre series
- [ ] Notas por ejercicio en la sesión
- [ ] Estadísticas por ejercicio (curva de progresión)
- [ ] Quick Log (sesión libre sin plantilla)
- [ ] Notificaciones push
- [ ] Compartir entrenamientos

### 📄 Licencia

MIT © 2024 — Manu Izquierdo

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
git clone https://github.com/YOUR_USERNAME/anotagym.git
cd anotagym
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

In Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /globalExercises/{exerciseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)/profile/data).data.role == 'admin';
    }
  }
}
```

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
- [ ] Rest timer between sets
- [ ] Per-exercise notes in session
- [ ] Exercise progression chart
- [ ] Free-form Quick Log session
- [ ] Push notifications
- [ ] Share workouts

### 📄 License

MIT © 2024 — Manu Izquierdo
