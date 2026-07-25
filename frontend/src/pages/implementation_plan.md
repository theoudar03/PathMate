# Implementation Plan - Leaflet to MapLibre GL JS Migration

This plan describes the replacement of the Leaflet-based Satellite View with a MapLibre GL JS implementation in the Campus Navigation module.

## User Review Required

> [!IMPORTANT]
> The SVG Layout Map view will remain untouched, ensuring zero impact on the custom 2D layout.
> This change introduces `maplibre-gl` to the project's frontend package dependencies. We will clean up `package.json` to remove the dynamic Leaflet script loadings.

> [!WARNING]
> To support Google Satellite Imagery without API keys or token limits in MapLibre, we will construct a custom MapLibre style JSON using Google Maps raster tile source layers.

## Open Questions

> [!NOTE]
> None. The layout and UI patterns will match the current Material Design 3 guidelines.

## Proposed Changes

---

### [Component Name] Map Configuration

#### [NEW] [mapConfig.js](file:///c:/Theo%20Personal%20storage/PathMate/frontend/src/config/mapConfig.js)
- Define MapLibre GL style templates for the three view modes (`satellite`, `hybrid`, `roadmap`) mapping Google Maps raster source URLs to centralize tile provider logic.

---

### [Component Name] Campus Navigation Views

#### [MODIFY] [SatelliteMapView.jsx](file:///c:/Theo%20Personal%20storage/PathMate/frontend/src/components/map/SatelliteMapView.jsx)
- Import `maplibre-gl` and its stylesheet.
- Replace Leaflet map initialization (`L.map`) with MapLibre initialization (`new maplibregl.Map`).
- Load map style dynamically using style templates defined in `mapConfig.js` when toggling modes.
- Implement HTML-based Material Design markers for all building presets using `maplibregl.Marker`.
- Implement Geolocation tracking using `navigator.geolocation.watchPosition` to display and animate a custom blue location marker.
- Add an SVG walking route layer to the map when `isNavigating` is active, connecting start presets/GPS location to the destination building coordinates.
- Restore the building information drawer card overlaying the map when a marker pin is clicked.
- Add custom floating controls (Zoom In, Zoom Out, Compass, Locate Me, Fullscreen) with Material styling.

---

### [Component Name] Clean Up Leaflet

#### [MODIFY] [package.json](file:///c:/Theo%20Personal%20storage/PathMate/frontend/package.json)
- Add `maplibre-gl` to package dependencies.

---

## Verification Plan

### Automated Tests
- Build verification:
  ```powershell
  npm run build
  ```

### Manual Verification
- Deploy changes to Firebase hosting, open the Campus Navigation view.
- Confirm "Satellite", "Hybrid", and "Roadmap" layer toggle controls load map tiles correctly.
- Click building markers and verify description cards load correctly.
- Verify GPS location tracker focuses and center buttons work.
- Select navigation and check that the walking route line is rendered on the map.
