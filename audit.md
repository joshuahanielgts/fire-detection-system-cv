# Agniv 2.0 Project Audit

This document provides a comprehensive technical audit of the **Agniv 2.0** AI Fire & Smoke Detection System, detailing its architecture, file structure, configuration, endpoints, components, and deployment setup.

---

## 1. Project Directory Structure

```text
Agniva2.0/
├── agniv-2.0/
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   └── Navbar.jsx
│       │   ├── pages/
│       │   │   ├── AddProperty.jsx
│       │   │   ├── CameraManagement.jsx
│       │   │   ├── Dashboard.jsx
│       │   │   ├── FaceVerification.jsx
│       │   │   ├── FireStationDashboard.jsx
│       │   │   ├── Landing.jsx
│       │   │   └── Login.jsx
│       │   ├── services/
│       │   │   ├── api.js
│       │   │   └── socket.js
│       │   ├── styles/
│       │   │   ├── AddProperty.css
│       │   │   ├── Auth.css
│       │   │   ├── CameraManagement.css
│       │   │   ├── Dashboard.css
│       │   │   ├── FaceVerification.css
│       │   │   ├── FireStationDashboard.css
│       │   │   └── Landing.css
│       │   ├── App.css
│       │   ├── App.jsx
│       │   ├── index.css
│       │   └── main.jsx
│       ├── .env.example
│       ├── .env.production
│       ├── index.html
│       ├── package.json
│       ├── postcss.config.js
│       ├── tailwind.config.js
│       └── vite.config.js
├── fire_detection_system/
│   ├── __init__.py
│   ├── .env
│   ├── .env.example
│   ├── detector.py
│   ├── requirements.txt
│   ├── server.py
│   └── yolov8n.pt
├── .gitignore
├── README.md
├── render.yaml
├── vercel.json
└── web_app.py
```

---

## 2. File Roles & Descriptions

### Root-Level Configuration
*   **[web_app.py](file:///d:/ex%20projects/Agniva2.0/web_app.py)**: Production entry point for Render/gunicorn deployment. It appends the project root to `sys.path`, imports the Flask app and Socket.IO instances from `fire_detection_system.server`, and boots the server.
*   **[render.yaml](file:///d:/ex%20projects/Agniva2.0/render.yaml)**: Service orchestration blueprint for Render. Configures a Python web service (Free plan, Singapore region) with gunicorn eventlet workers, binding to `$PORT`.
*   **[vercel.json](file:///d:/ex%20projects/Agniva2.0/vercel.json)**: Production router and build configuration for Vercel. Redirects all browser requests to `index.html` (supporting React Router SPA history) and proxies `/api/*` requests to the production Render URL.
*   **[README.md](file:///d:/ex%20projects/Agniva2.0/README.md)**: Standard markdown guide explaining Vercel/Render deployments, environment setups, and local dev execution.
*   **[.gitignore](file:///d:/ex%20projects/Agniva2.0/.gitignore)**: Configures rules to keep build outputs, dependencies, and environment files out of version control.

### Python Backend (`fire_detection_system/`)
*   **[__init__.py](file:///d:/ex%20projects/Agniva2.0/fire_detection_system/__init__.py)**: Package initializer file.
*   **[requirements.txt](file:///d:/ex%20projects/Agniva2.0/fire_detection_system/requirements.txt)**: Python package dependencies pinned to specific versions (Flask 3.0.3, OpenCV-headless, Torch, Ultralytics, eventlet).
*   **[detector.py](file:///d:/ex%20projects/Agniva2.0/fire_detection_system/detector.py)**: AI Detection core. Defines `FireSmokeDetector` supporting:
    *   *YOLOv8*: Loads `yolov8n.pt` with a PyTorch 2.6+ unpickling compatibility patch. Flags detections with confidence > 30%.
    *   *HSV Fallback*: Executed if PyTorch is unavailable or if YOLO yields no hits. Evaluates specific HSV color masks for fire/smoke, performs morph open/close operations, and filters contours > 800px.
*   **[server.py](file:///d:/ex%20projects/Agniva2.0/fire_detection_system/server.py)**: Flask + Flask-SocketIO server configuration. Exposes API endpoints and Socket.IO events, handles cross-origin rules, and implements secure session cookies.

### React Frontend (`agniv-2.0/frontend/`)
*   **[package.json](file:///d:/ex%20projects/Agniva2.0/agniv-2.0/frontend/package.json)**: Frontend dependency tree defining React 18, React Router 6, Axios, Socket.IO client, and Tailwind.
*   **[vite.config.js](file:///d:/ex%20projects/Agniva2.0/agniv-2.0/frontend/vite.config.js)**: Configures dev port 5173 and proxies `/api` and `/socket.io` to `http://localhost:5000`.
*   **[tailwind.config.js](file:///d:/ex%20projects/Agniva2.0/agniv-2.0/frontend/tailwind.config.js)**: Sets up Tailwind paths, Outfit/Inter typography, and custom `fire.500`/`fire.600` colors.
*   **[postcss.config.js](file:///d:/ex%20projects/Agniva2.0/agniv-2.0/frontend/postcss.config.js)**: Standard post-css directives for Tailwind processing.
*   **[index.html](file:///d:/ex%20projects/Agniva2.0/agniv-2.0/frontend/index.html)**: Main HTML skeleton linking Outfit/Inter Google fonts and a custom inline fire emoji SVG favicon.
*   **[src/main.jsx](file:///d:/ex%20projects/Agniva2.0/agniv-2.0/frontend/src/main.jsx)**: React DOM renderer initiating the root element in StrictMode.
*   **[src/index.css](file:///d:/ex%20projects/Agniva2.0/agniv-2.0/frontend/src/index.css)**: Global stylesheet defining core resets, scrollbars, and Tailwind directives.
*   **[src/App.css](file:///d:/ex%20projects/Agniva2.0/agniv-2.0/frontend/src/App.css)**: Holds variables, animated backgrounds, button classes, and glassmorphic card classes.
*   **[src/App.jsx](file:///d:/ex%20projects/Agniva2.0/agniv-2.0/frontend/src/App.jsx)**: Context Provider (`AuthContext` mapping users in `sessionStorage` key `agniv_user`) and navigation routes.
*   **[src/components/Navbar.jsx](file:///d:/ex%20projects/Agniva2.0/agniv-2.0/frontend/src/components/Navbar.jsx)**: Top-fixed navbar using dark glassmorphism, responsive dropdown triggers, and truncated email details.

---

## 3. Backend Endpoints & Socket.IO Events

### REST API Endpoints
All API endpoints are prefixed with `/api`:

| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | `{ email, name }` | Registers/Authenticates session. Accepts any email; name is optional. |
| `POST` | `/api/logout` | None | Clears the session object. |
| `GET` | `/api/me` | None | Returns active user object or `401`. |
| `GET` | `/api/properties` | None | Returns a list of all monitored properties. |
| `POST` | `/api/properties` | `{ name, address, lat, lng, password }` | Registers a new property. Generates a UUID. Emits `property_added`. |
| `GET` | `/api/properties/<id>`| None | Returns specific property or `404`. |
| `DELETE`| `/api/properties/<id>`| None | Deletes specific property or `404`. |
| `GET` | `/api/health` | None | System status check. Reports YOLO/HSV loading and system state. |
| `POST` | `/api/start_detection`| None | Starts detection stream monitoring. |
| `POST` | `/api/stop_detection` | None | Stops detection stream monitoring. |
| `GET` | `/api/status` | None | Returns active monitoring stats (running state, detections). |
| `POST` | `/api/detect_image` | File or `{ image_data }` | Runs AI detection on image payloads. Returns annotated JPEG base64 and logs alerts. |
| `POST` | `/api/detect_frame` | `{ frame }` | Decodes base64 frame, processes detection, and reports alerts. |
| `GET` | `/api/alerts` | Query: `?limit=50` | Returns logs of historical incidents (capped at 200). |
| `POST` | `/api/alerts/clear` | None | Resets active alerts arrays. Emits `alerts_cleared`. |

### Socket.IO Channels
*   `connect`: Client connection acknowledgment. Emits `{"message": "Connected to Agniv 2.0"}`.
*   `property_added`: Broadcasts newly registered facility configurations to clients.
*   `alert`: Broadcasts active incident objects (timestamp, detections list, source) to clients.
*   `alerts_cleared`: Broadcasts alerts history clearing triggers to clients.

---

## 4. Frontend Routing Table

| Path | Access | Component | Layout Layout |
| :--- | :--- | :--- | :--- |
| `/` | Public | `Landing.jsx` | Full-Screen Landing Hero |
| `/login` | Public | `Login.jsx` | Centered Glass Card Form |
| `/dashboard` | Protected | `Dashboard.jsx` | Protected + Navbar |
| `/camera/:propertyId` | Protected | `CameraManagement.jsx` | Protected + Navbar |
| `/verify` | Protected | `FaceVerification.jsx` | Protected + Navbar |
| `/fire-station` | Protected | `FireStationDashboard.jsx` | Protected + Navbar |
| `/add-property` | Protected | `AddProperty.jsx` | Protected + Navbar |
| `*` | Fallback | Redirects to `/` | N/A |

---

## 5. Security & Session Handling
*   **Cookie Attributes**: Secure session cookie flags (`SESSION_COOKIE_SAMESITE="None"` and `SESSION_COOKIE_SECURE=True`) are enabled on the backend Flask instance to support credentials transmission across different domains (Vercel frontend and Render backend).
*   **CORS Settings**: Restricts origins dynamically via the `ALLOWED_ORIGINS` environment variable, ensuring local configurations (`localhost:5173`, `localhost:3000`) and the Vercel domain are whitelisted. `supports_credentials=True` is enabled.
