# Muhammad Shaheer · Civil Engineer Portfolio

**Live:** https://shaheer-portfolio-sigma.vercel.app

An interactive 3D portfolio. Visitors walk down a single-floor concrete corridor
with exposed steel portal frames, framed engineering drawings and steel/rebar
exhibits. Muhammad greets them at the reception counter, and four doors open
into rooms: **About Me**, **Projects**, **Extracurricular** and **Contact**.

Built with React 19, Vite, Three.js and React Three Fiber. The interaction model
(scroll to walk a corridor, open doors into rooms) is adapted from
[ITom's open-source portfolio](https://github.com/ITomPoland/portfolio-itom) (MIT).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Controls

- Scroll, drag (touch) or arrow keys: walk the corridor
- Click a door, a header link or a room on the floor plan: enter that room
- Esc or **Back to corridor**: leave a room
- **Blueprint** toggle: switches the whole building to a blueprint wireframe
- Deep links: `/#about`, `/#projects`, `/#activities`, `/#contact`

## Editing content

All text lives in [`src/civil/content.js`](src/civil/content.js): profile, stats,
expertise, projects, experience, extracurricular activities and the door layout.
The projects, figures, experience entries, activities, email and phone are
**starter content**. Replace them with real details before publishing.

| File | What it does |
| --- | --- |
| `src/civil/CorridorScene.jsx` | 3D corridor, doors, rooms, avatar and camera |
| `src/civil/textures.js` | Procedural concrete, signs and framed structure drawings |
| `src/civil/CivilApp.jsx` | Preloader, intro, floor plan, room panels and controls |
| `src/civil/ProjectDrawing.jsx` | Line-drawing thumbnails for projects |
| `public/avatar/` | Avatar cut-out and portrait photo |

## Deploying

The site is hosted on Vercel and connected to this repo: every push to `main`
deploys automatically to https://shaheer-portfolio-sigma.vercel.app.
