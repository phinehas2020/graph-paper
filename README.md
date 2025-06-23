# Graph Paper 3D

A modern web application for interactive 3D modeling and drawing, built with Next.js, TypeScript, and Three.js.

## Features
- **3D Modeling:** Create and manipulate 3D objects using an intuitive interface powered by Three.js.
- **Custom Tools:** Includes tools for drawing walls, floors, and openings.
- **Progressive Web App:** Offline support and installability via service worker and manifest.
- **Responsive Design:** Mobile-friendly UI with custom hooks for device detection.
- **Reusable Components:** Modular UI components for rapid development.
- **Export Options:** Utilities for exporting your creations.
- **Testing:** Unit tests for core logic and tools.

## Technologies Used
- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Jest](https://jestjs.io/) (for testing)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (or npm/yarn)

### Installation
```bash
pnpm install
```

### Development
```bash
pnpm dev
```

### Build
```bash
pnpm build
```

### Test
```bash
pnpm test
```

## Project Structure
- `app/` – Next.js app directory (pages, layouts, global styles)
- `components/` – Reusable React components and UI primitives
- `hooks/` – Custom React hooks
- `lib/` – Utility functions
- `public/` – Static assets and PWA files
- `src/` – Core logic (animation, export, model, three.js integration, tools)

## License
MIT (add your license here)

---

Feel free to contribute or open issues for suggestions and bug reports! 