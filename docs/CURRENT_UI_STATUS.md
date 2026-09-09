# Current UI Status Audit

## Last Audited: 2026-09-06

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3.1 |
| Language | TypeScript | ~5.6.2 |
| Bundler | Vite | ^6.0.0 |
| Maps | Leaflet + react-leaflet | 1.9 / 4.2.1 |
| Charts | Recharts | ^3.10.1 |
| Icons | lucide-react | ^1.40.0 |
| Styling | Vanilla CSS (index.css) | — |
| Font | Outfit (Google Fonts) | — |
| 3D | None installed (Three.js NOT in deps) | — |
| State | React useState (local only) | — |
| Routing | None (state-based page switching) | — |

---

## 2. Existing File Structure

```
frontend/src/
├── App.tsx                    # Entry: renders <AdvancedDashboard />
├── AdvancedDashboard.tsx      # Main shell: sidebar + header + page switching
├── main.tsx                   # ReactDOM.createRoot
├── index.css                  # Design system CSS vars + glass-panel
├── vite-env.d.ts
├── api/                       # EMPTY (.gitkeep only)
├── charts/                    # EMPTY (.gitkeep only)
├── components/
│   ├── Charts.tsx             # Recharts: profile, scatter, sonar
│   ├── ExplainabilityMap.tsx   # Canvas-based saliency heatmap (fetch-based)
│   ├── Heatmap.tsx            # Canvas 2D heatmap renderer
│   ├── MapComponent.tsx       # Leaflet map with NASA GIBS SST overlay
│   ├── MetricCard.tsx         # Reusable metric display card
│   ├── Sidebar.tsx            # Navigation sidebar with activePage props
│   ├── SimulationControls.tsx # What-If simulation sliders (fetch-based)
│   └── Stack3D.tsx            # CSS 3D transform stacked heatmap layers
├── features/                  # EMPTY (.gitkeep only)
├── maps/                      # EMPTY (.gitkeep only)
├── state/                     # EMPTY (.gitkeep only)
└── three/                     # EMPTY (.gitkeep only)
```

---

## 3. Page Status

| Page | Sidebar ID | Status | Description |
|------|-----------|--------|-------------|
| Dashboard | `Dashboard` | ✅ COMPLETE | Metrics, Map, 3D Stack, Charts, Sonar |
| Satellite Data | `Satellite` | ❌ PLACEHOLDER | "This module is currently under development." |
| Temperature Reconstruction | `Temperature` | ❌ PLACEHOLDER | "This module is currently under development." |
| 3D Ocean View | `3DOcean` | ❌ PLACEHOLDER | "This module is currently under development." |
| Validation (ARGO) | `Validation` | ⚠️ PARTIAL | Basic profile chart + 4 hardcoded metric cards |
| Analysis & Insights | `Analysis` | ⚠️ PARTIAL | SimulationControls + Stack3D + ExplainabilityMap |
| Download Data | `Download` | ❌ PLACEHOLDER | "This module is currently under development." |
| Documentation | `Documentation` | ❌ PLACEHOLDER | "This module is currently under development." |

---

## 4. Existing Components Assessment

| Component | Functional? | Reusable? | Issues |
|-----------|------------|-----------|--------|
| MetricCard | ✅ Yes | ✅ Yes | Uses `any` types |
| Charts | ✅ Yes | ⚠️ Partial | Only supports profile/scatter/sonar, uses `any` |
| Heatmap | ✅ Yes | ✅ Yes | Well-typed, canvas-based |
| MapComponent | ✅ Yes | ⚠️ Partial | Hardcoded center/marker, no click handler, no variable switching |
| Sidebar | ✅ Yes | ✅ Yes | Properly typed with props |
| Stack3D | ✅ Yes | ⚠️ Partial | CSS-transform based (not real 3D), uses `any` |
| SimulationControls | ✅ Yes | ⚠️ Partial | Fetch-based, no error handling UI |
| ExplainabilityMap | ⚠️ Partial | ❌ No | Hardcoded dimensions, no error retry |

---

## 5. State Management Assessment

**Current:** All state lives in `AdvancedDashboard.tsx` as local `useState`.

**Problems:**
- No shared state between pages
- No global context (date, region, depth, variable)
- Each page fetches independently
- No state synchronization when navigating
- No demo mode state

---

## 6. API Integration

**Backend:** FastAPI at `http://localhost:8000`

| Endpoint | Method | Used By | Status |
|----------|--------|---------|--------|
| `/api/v1/data/surface` | GET | Dashboard | ✅ Working |
| `/api/v1/inference` | GET | Dashboard | ✅ Working |
| `/api/v1/profile?lat=&lon=` | GET | Dashboard | ✅ Working |
| `/api/v1/simulate` | POST | SimulationControls | ✅ Working |
| `/api/v1/explain` | GET | ExplainabilityMap | ✅ Working |

---

## 7. Design System

**Established:** CSS custom properties in `index.css`

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-color` | `#04080F` | Page background |
| `--card-bg` | `#0A111E` | Card/panel background |
| `--card-border` | `rgba(255,255,255,0.08)` | Subtle borders |
| `--text-primary` | `#F3F4F6` | Primary text |
| `--text-secondary` | `#9CA3AF` | Secondary text |
| `--accent-cyan` | `#38BDF8` | Primary accent |
| `--accent-blue` | `#3B82F6` | Secondary accent |
| `--accent-glow` | `rgba(56,189,248,0.3)` | Glow effects |

**Class:** `.glass-panel` — standard card styling

---

## 8. Data Assets

| Asset | Path | Format | Size |
|-------|------|--------|------|
| Training samples | `data/samples/train/` | `.npz` | 16 files, ~11MB each |
| Demo samples | `data/samples/demo/` | — | EMPTY |
| Norm stats | `artifacts/norm_stats.npz` | `.npz` | 1.2KB |
| Best model | `artifacts/checkpoints/best_model.pt` | PyTorch | 43MB |
| Last model | `artifacts/checkpoints/last_model.pt` | PyTorch | 14MB |

---

## 9. Critical Gaps

1. **No global state management** — pages are isolated
2. **No TypeScript types/interfaces** — most props use `any`
3. **No demo data layer** — demo/samples dir is empty
4. **No 3D library installed** — Three.js / R3F not in package.json
5. **5 pages are pure placeholders** — Satellite, Temperature, 3DOcean, Download, Documentation
6. **2 pages are partially implemented** — Validation and Analysis
7. **No cross-page state synchronization**
8. **No loading/error/empty states** on most components
9. **No date picker, depth slider, region selector, variable selector** components
10. **Top navigation pills only partially wired** (Home/Insights/Validation work, Explore/Model/About do nothing)
