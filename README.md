# Graph Paper 3D

A modern web application for interactive 3D modeling and drawing, built with Next.js, TypeScript, and Three.js.

## 🎉 NEW: 2D-to-3D Floor Plan Builder

Transform your 2D floor plans into stunning 3D models with just a few clicks!

### Quick Start Guide

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Open the Floor Plan Designer:**
   Navigate to `http://localhost:3000/three`

3. **Design your floor plan:**
   - Press **F** to activate Floor tool - click to add points, click near first point to close
   - Press **W** to activate Wall tool - click start, then end points to draw walls
   - Press **S** for Select tool to interact with elements
   - Press **ESC** to cancel current drawing

4. **Connect walls:**
   - Click "Auto-Connect Walls" to automatically connect nearby endpoints
   - Connected walls show in green with orange connection indicators

5. **Build your 3D model:**
   - Click "Build 3D Model" to see your creation in 3D!
   - Use mouse to orbit, zoom, and explore

## Features
- **2D Floor Plan Designer:** Intuitive click-to-draw interface
- **Smart Wall Connections:** Automatic endpoint detection and connection
- **Real-time 3D Generation:** Instant conversion from 2D to 3D
- **Interactive 3D Viewer:** Professional orbit controls with lighting and shadows
- **Visual Feedback:** Grid snapping, connection indicators, and drawing previews
- **Keyboard Shortcuts:** Fast tool switching (F/W/S keys)
- **Progressive Web App:** Offline support and installability
- **Responsive Design:** Works on desktop and mobile
- **Export Options:** Utilities for exporting your creations
- **Testing:** Unit tests for core logic and tools

## Technologies Used
- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand) (State Management)
- [Jest](https://jestjs.io/) (for testing)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Installation
```bash
npm install --legacy-peer-deps
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

## Project Structure
- `app/` – Next.js app directory (pages, layouts, global styles)
- `components/` – Reusable React components and UI primitives
- `hooks/` – Custom React hooks
- `lib/` – Utility functions
- `public/` – Static assets and PWA files
- `src/` – Core logic
  - `animation/` – Animation components
  - `components/` – 2D canvas, tools, and controls
  - `export/` – Export utilities
  - `model/` – Data types and state management
  - `three/` – 3D mesh generation and viewer
  - `tools/` – Floor and wall drawing tools

## Usage Tips

### Drawing Floors
1. Press **F** to activate Floor tool
2. Click to place points around your floor perimeter
3. Click near the first point to close the shape
4. The floor will appear as a light gray filled area

### Drawing Walls
1. Press **W** to activate Wall tool
2. Click to set the start point of your wall
3. Click again to set the end point
4. Continue clicking to add more walls
5. Press **Enter** or **ESC** when finished

### Connecting Walls
- Walls automatically snap to nearby endpoints
- Click "Auto-Connect Walls" to connect all nearby endpoints at once
- Connected walls show in green instead of blue
- Orange circles indicate connection points

### 3D Mode
- Click "Build 3D Model" to switch to 3D view
- Use mouse to orbit around your model
- Scroll to zoom in/out
- Click "Back to 2D" to return to editing

## Keyboard Shortcuts
- **F** - Floor drawing tool
- **W** - Wall drawing tool  
- **S** - Select tool
- **ESC** - Cancel current drawing/tool
- **Enter** - Finish wall drawing (when in wall mode)

## License
MIT

---

Built with ❤️ using modern web technologies. Start designing your dream floor plans today! 