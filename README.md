# Auditorium

Interactive theater seat reservation system with canvas-based visualization, pan/zoom support, and optimal seat-finding algorithm.

## Features

- **Canvas rendering** - Full-viewport canvas with mouse drag (pan) and scroll wheel (zoom)
- **Seat interaction** - Click seats to toggle occupied/free state
- **Random reservation** - Fill seats randomly with configurable occupancy (min 20%)
- **Optimal seat finding** - Weighted scoring algorithm that ranks best contiguous blocks of N adjacent free seats based on:
  - Price category (higher = better)
  - Sector preference (Auditorium > Balcony > Boxes)
  - Row proximity to stage
  - Position centered in row
- **Result visualization** - Select a result to highlight the seats on the canvas in red
- **Dark glassmorphism UI** - Modern panel with spinner controls and scrollable results table

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla JavaScript (ES6+) |
| Module System | ES Modules |
| Build | Vite |
| Testing | Vitest |
| Rendering | HTML5 Canvas |

## Project Structure

```
src/
  app.js                         # Entry point
  index.html                     # HTML shell
  style/style.css                # Global styles
  components/
    Auditorium/Auditorium.js     # Main app: scoring, UI panel, orchestration
    CanvasRenderer/CanvasRenderer.js  # Canvas drawing, pan/zoom, hit testing
    Sector/Sector.js             # Sector model + rendering
    Row/Row.js                   # Row model + rendering
    Seat/Seat.js                 # Seat model + state
  model/
    sectorMap/sectorMaps.js      # 2D seat layout arrays per sector
    sectorConfigs/sectorConfigs.js  # Sector properties (position, angle, preference)
    Tickets/TicketCategory.js    # Ticket price/category mapping
    language/language.js         # Ordinal suffix map for row numbering
  utils/domelemjs/               # Custom DOM element factory
  __tests__/                     # Unit tests
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## Usage

1. Open the app in a browser (via `npm run dev` or the deployed GitHub Pages URL)
2. **Pan**: Click and drag anywhere on the canvas
3. **Zoom**: Use the mouse wheel (zooms toward cursor)
4. **Toggle seats**: Click any seat to mark it occupied/free
5. **Randomize**: Set occupancy ratio and click "randomize" to fill seats randomly
6. **Reserve**: Set desired number of seats (2-8) and click "reserve" to find optimal blocks
7. **Select result**: Click a radio button in the results table to highlight that block on the canvas

## License

[MIT](LICENSE.md)
