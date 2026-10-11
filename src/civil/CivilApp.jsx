import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { profile, rooms, corridor, expertise, projects, experience, activities } from './content';
import ProjectDrawing from './ProjectDrawing';

const CorridorScene = lazy(() => import('./CorridorScene'));

const STEPS = ['Surveying the site', 'Casting the floor slab', 'Erecting steel frames', 'Hanging the drawings', 'Opening the doors'];

const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower = typeof navigator !== 'undefined' && (
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
);

function waitForFonts() {
  if (!document.fonts?.load) return Promise.resolve();
  const fonts = Promise.all([
    document.fonts.load('600 64px "IBM Plex Mono"'),
    document.fonts.load('700 64px "Archivo"'),
    document.fonts.load('800 64px "Archivo"'),
  ]);
  return Promise.race([fonts, new Promise(r => setTimeout(r, 1800))]);
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const clampZ = z => Math.min(corridor.start, Math.max(corridor.end, z));

/* ------------------------------------------------------------------ */

function Preloader({ ready, onDone }) {
  const [pct, setPct] = useState(0);
  const [hidden, setHidden] = useState(false);
  const startRef = useRef(0);
  useEffect(() => {
    let raf;
    if (!startRef.current) startRef.current = performance.now();
    const start = startRef.current;
    const tick = now => {
      const timed = Math.min(1, (now - start) / 1800);
      const next = Math.min(timed, ready ? 1 : 0.9);
      setPct(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);
  useEffect(() => {
    if (pct < 1) return;
    const t = setTimeout(() => { setHidden(true); onDone(); }, 350);
    return () => clearTimeout(t);
  }, [pct, onDone]);

  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(pct * STEPS.length))];
  return (
    <div className={`preloader ${pct >= 1 ? 'is-done' : ''} ${hidden ? 'is-hidden' : ''}`} role="status" aria-live="polite">
      <div className="preloader__inner">
        <div className="preloader__mark" aria-hidden="true">
          <span style={{ transform: `scaleY(${pct})` }} />
          {profile.initials}
        </div>
        <p className="mono preloader__step">{step}…</p>
        <div className="preloader__bar"><span style={{ transform: `scaleX(${pct})` }} /></div>
        <p className="mono preloader__pct">{String(Math.round(pct * 100)).padStart(3, '0')}%</p>
      </div>
    </div>
  );
}

function Header({ blueprint, onToggleBlueprint, onHome, onRoom, activeRoom }) {
  return (
    <header className="site-header">
      <a className="brand" href="/" onClick={e => { e.preventDefault(); onHome(); }}>
        <span className="brand__mark" aria-hidden="true">{profile.initials}</span>
        <span className="brand__text">
          <strong>{profile.name}</strong>
          <span className="mono">{profile.title}</span>
        </span>
      </a>
      <nav className="site-nav" aria-label="Rooms">
        {rooms.map(r => (
          <a key={r.id} href={`#${r.id}`} aria-current={activeRoom === r.id ? 'page' : undefined}
            onClick={e => { e.preventDefault(); onRoom(r.id); }}>{r.label}</a>
        ))}
      </nav>
      <button type="button" className={`toggle ${blueprint ? 'is-on' : ''}`} onClick={onToggleBlueprint} aria-pressed={blueprint}>
        <span className="toggle__dot" aria-hidden="true" />
        <span className="mono">Blueprint</span>
      </button>
    </header>
  );
}

// Floor plan of the corridor. The camera marker is moved directly via a ref.
function FloorPlan({ camZ, onRoom, activeRoom }) {
  const marker = useRef(null);
  const W = 260, H = 96, pad = 12;
  const zToX = z => pad + ((corridor.start + 2 - z) / (corridor.start + 2 - (corridor.end - 4))) * (W - pad * 2);
  useEffect(() => {
    let raf;
    const tick = () => {
      if (marker.current) marker.current.setAttribute('transform', `translate(${zToX(camZ.current)} ${H / 2})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });
  return (
    <figure className="plan" aria-label="Floor plan">
      <svg viewBox={`0 0 ${W} ${H}`} role="group">
        <rect x={pad} y={H / 2 - 9} width={W - pad * 2} height={18} className="plan__corridor" />
        {rooms.map(r => {
          const x = zToX(r.z);
          const up = r.side === 'left';
          return (
            <g key={r.id} className={`plan__room ${activeRoom === r.id ? 'is-active' : ''}`} onClick={() => onRoom(r.id)}
              role="button" tabIndex={0} aria-label={`Enter ${r.label}`}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRoom(r.id); } }}>
              <rect x={x - 22} y={up ? 6 : H / 2 + 11} width={44} height={H / 2 - 17} />
              <line x1={x - 6} x2={x + 6} y1={up ? H / 2 - 9 : H / 2 + 9} y2={up ? H / 2 - 9 : H / 2 + 9} className="plan__door" />
              <text x={x} y={up ? 22 : H - 14} textAnchor="middle">{r.number}</text>
            </g>
          );
        })}
        <g ref={marker} className="plan__cam"><path d="M5 -5 L-6 0 L5 5 Z" /></g>
      </svg>
      <figcaption className="mono">Ground floor plan · 1:500</figcaption>
    </figure>
  );
}

/* ---------------- room panels ---------------- */

function RoomHead({ room, title }) {
  return (
    <div className="section-head">
      <p className="eyebrow mono"><span className="tri" aria-hidden="true" />Room {room.number} · {room.label}</p>
      <h2>{title}</h2>
    </div>
  );
}

function AboutRoom({ room }) {
  return (
    <>
      <div className="about-top">
        <img src={profile.portrait} alt={`Portrait of ${profile.name}`} className="portrait" width="160" height="200" />
        <div>
          <RoomHead room={room} title="Every structure starts below ground." />
          <p className="mono about-focus">{profile.focus}</p>
        </div>
      </div>
      {profile.about.map(p => <p key={p.slice(0, 24)}>{p}</p>)}
      <dl className="stats">
        {profile.stats.map(s => <div key={s.label}><dt>{s.value}</dt><dd className="mono">{s.label}</dd></div>)}
      </dl>
      <h3 className="sub mono">Expertise</h3>
      <ul className="columns">
        {expertise.map(x => (
          <li key={x.code}>
            <span className="col-mark mono">{x.code}</span>
            <h4>{x.title}</h4>
            <p>{x.body}</p>
            <ul className="chips">{x.tools.map(t => <li key={t} className="mono">{t}</li>)}</ul>
          </li>
        ))}
      </ul>
      <h3 className="sub mono">Experience & education</h3>
      <ol className="timeline">
        {experience.map(e => (
          <li key={e.period + e.role}>
            <span className="timeline__elev mono"><span className="tri" aria-hidden="true" />{e.elevation}</span>
            <div>
              <p className="mono timeline__period">{e.period}</p>
              <h4>{e.role}</h4>
              <p className="timeline__org">{e.org}</p>
              <ul>{e.points.map(pt => <li key={pt}>{pt}</li>)}</ul>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function ProjectsRoom({ room, onOpen }) {
  const [filter, setFilter] = useState('All');
  const categories = useMemo(() => ['All', ...new Set(projects.map(p => p.category))], []);
  const shown = filter === 'All' ? projects : projects.filter(p => p.category === filter);
  return (
    <>
      <RoomHead room={room} title="Drawing register: selected work." />
      <div className="filters" role="group" aria-label="Filter projects">
        {categories.map(c => (
          <button key={c} type="button" className={`chip-btn mono ${filter === c ? 'is-on' : ''}`} aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>
      <ul className="register">
        {shown.map(p => (
          <li key={p.id}>
            <button type="button" className="project" onClick={() => onOpen(p)}>
              <ProjectDrawing type={p.drawing} title={p.title} />
              <span className="project__sheet mono">{p.sheet}</span>
              <span className="project__body">
                <strong>{p.title}</strong>
                <span className="mono">{p.category} · {p.location} · {p.year}</span>
                <span className="project__role">{p.role}</span>
              </span>
              <span className="project__open mono" aria-hidden="true">Open sheet →</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

const ACTIVITY_ICONS = {
  truss: 'M2 18h20M4 18l4-8 4 8 4-8 4 8M8 10h8',
  people: 'M8 11a3 3 0 100-6 3 3 0 000 6zM16 11a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5M12 20c0-3 2-5 4-5s6 2 6 5',
  helmet: 'M3 17h18M5 17a7 7 0 0114 0M12 6v4M9 7l1 3M15 7l-1 3',
  hands: 'M4 13l4 4 4-2 4 2 4-4M8 11l4-4 4 4M12 7v10',
  cricket: 'M4 20l9-9M13 11l3-3 4 4-3 3zM6 6a2 2 0 100-4 2 2 0 000 4z',
  cert: 'M5 3h14v12H5zM9 7h6M9 10h6M10 15l-2 6 4-2 4 2-2-6',
};

function ActivitiesRoom({ room }) {
  return (
    <>
      <RoomHead room={room} title="Beyond the drawings." />
      <p>What I do outside design offices and site meetings: competitions, societies and the people side of engineering.</p>
      <ul className="activities">
        {activities.map(a => (
          <li key={a.title}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="activity__icon"><path d={ACTIVITY_ICONS[a.icon]} /></svg>
            <div>
              <p className="mono activity__meta">{a.role} · {a.period}</p>
              <h4>{a.title}</h4>
              <p>{a.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ContactRoom({ room }) {
  const [sent, setSent] = useState(false);
  const onSubmit = e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = `${data.get('type')} enquiry from ${data.get('name')}`;
    const body = `${data.get('message')}\n\n${data.get('name')} (${data.get('email')})`;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };
  return (
    <>
      <RoomHead room={room} title="Let's build what's next." />
      <p>Have a structure to design, a site that needs supervising, or quantities that need checking? Send the brief and I'll reply within two working days.</p>
      <ul className="contact__list">
        <li><span className="mono">Email</span><a href={`mailto:${profile.email}`}>{profile.email}</a></li>
        <li><span className="mono">Phone</span><a href={`tel:${profile.phone.replace(/\s/g, '')}`}>{profile.phone}</a></li>
        <li><span className="mono">Based</span><span>{profile.location}</span></li>
        {profile.links.filter(l => !l.href.startsWith('mailto')).map(l => (
          <li key={l.label}><span className="mono">{l.label}</span><a href={l.href} target="_blank" rel="noopener noreferrer">{l.href.replace(/^https?:\/\/(www\.)?/, '')}</a></li>
        ))}
      </ul>
      <form className="contact-form" onSubmit={onSubmit}>
        <div className="field-row">
          <label><span className="mono">Name</span><input name="name" required autoComplete="name" /></label>
          <label><span className="mono">Email</span><input name="email" type="email" required autoComplete="email" /></label>
        </div>
        <label>
          <span className="mono">Project type</span>
          <select name="type" defaultValue="Structural design">
            <option>Structural design</option>
            <option>Site supervision</option>
            <option>Quantity surveying / BOQ</option>
            <option>Planning & scheduling</option>
            <option>Full-time role</option>
            <option>Other</option>
          </select>
        </label>
        <label><span className="mono">Message</span><textarea name="message" rows={4} required placeholder="Site, scope, timeline…" /></label>
        <button type="submit" className="btn btn--accent">{sent ? 'Opening your mail app…' : 'Send enquiry'}</button>
      </form>
      <footer className="footer mono">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>3D experience adapted from <a href="https://github.com/ITomPoland/portfolio-itom" target="_blank" rel="noopener noreferrer">ITom's open-source portfolio</a> (MIT)</span>
      </footer>
    </>
  );
}

function ProjectSheet({ project, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <article className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={e => e.stopPropagation()}>
        <div className="sheet__top">
          <p className="mono">Sheet {project.sheet} · {project.category}</p>
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="Close project">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="sheet__drawing"><ProjectDrawing type={project.drawing} title={project.title} /></div>
        <h3 id="sheet-title">{project.title}</h3>
        <p className="sheet__meta mono">{project.location} · {project.year} · {project.role}</p>
        <p>{project.summary}</p>
        <dl className="figures">
          {project.figures.map(f => <div key={f.label}><dt className="mono">{f.label}</dt><dd>{f.value}</dd></div>)}
        </dl>
        <h4 className="mono">Scope of work</h4>
        <ul className="scope">{project.scope.map(s => <li key={s}>{s}</li>)}</ul>
        <div className="title-block mono" aria-hidden="true">
          <span>Drawn: {profile.initials}</span><span>Checked: {profile.initials}</span><span>Rev: A</span><span>Scale: NTS</span>
        </div>
      </article>
    </div>
  );
}

const ROOM_VIEWS = { about: AboutRoom, projects: ProjectsRoom, activities: ActivitiesRoom, contact: ContactRoom };

/* ------------------------------------------------------------------ */

export default function CivilApp() {
  const [sceneReady, setSceneReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [blueprint, setBlueprint] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);   // room the camera is heading into / inside
  const [panelRoom, setPanelRoom] = useState(null);     // room whose panel is shown
  const [openProject, setOpenProject] = useState(null);
  const [sceneFailed, setSceneFailed] = useState(() => typeof window !== 'undefined' && !webglAvailable());
  const zTarget = useRef(corridor.start);
  const camZ = useRef(corridor.start + 3);
  const introRef = useRef(null);
  const busy = activeRoom !== null;

  useEffect(() => { waitForFonts().then(() => setFontsReady(true)); }, []);

  // Walk the corridor: wheel, touch drag and keyboard move the camera target
  useEffect(() => {
    if (!started || busy || sceneFailed) return;
    const walk = d => { zTarget.current = clampZ(zTarget.current - d); };
    const onWheel = e => {
      if (e.target.closest?.('.panel, .sheet')) return;
      e.preventDefault();
      walk((e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * 0.012);
    };
    let lastY = null;
    const onTouchStart = e => { lastY = e.touches[0].clientY; };
    const onTouchMove = e => {
      if (lastY === null || e.target.closest?.('.panel, .sheet, .site-header')) return;
      const y = e.touches[0].clientY;
      walk((lastY - y) * 0.035);
      lastY = y;
    };
    const onKey = e => {
      if (e.target.closest?.('input, textarea, select')) return;
      if (['ArrowUp', 'w', 'W', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); walk(e.key === 'PageDown' || e.key === ' ' ? 6 : 1.5); }
      if (['ArrowDown', 's', 'S', 'PageUp'].includes(e.key)) { e.preventDefault(); walk(e.key === 'PageUp' ? -6 : -1.5); }
      if (e.key === 'Home') zTarget.current = corridor.start;
      if (e.key === 'End') zTarget.current = corridor.end;
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [started, busy, sceneFailed]);

  // Fade the intro as the visitor walks away from the lobby
  useEffect(() => {
    let raf;
    const tick = () => {
      if (introRef.current) {
        const o = Math.max(0, Math.min(1, (camZ.current - (corridor.start - 5)) / 4));
        introRef.current.style.opacity = String(o);
        introRef.current.style.visibility = o < 0.02 ? 'hidden' : 'visible';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = blueprint ? 'blueprint' : 'site';
  }, [blueprint]);

  const enterRoom = useCallback(id => {
    setOpenProject(null);
    if (sceneFailed) { setActiveRoom(id); setPanelRoom(id); return; }
    if (activeRoom === id) return;
    setPanelRoom(null);
    setActiveRoom(id);
  }, [activeRoom, sceneFailed]);

  const leaveRoom = useCallback(() => {
    setOpenProject(null);
    setPanelRoom(null);
    setActiveRoom(null);
  }, []);

  const goHome = useCallback(() => {
    if (activeRoom) leaveRoom();
    zTarget.current = corridor.start;
  }, [activeRoom, leaveRoom]);

  // Esc leaves the room
  useEffect(() => {
    if (!panelRoom) return;
    const onKey = e => { if (e.key === 'Escape') leaveRoom(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelRoom, leaveRoom]);

  // Deep links (#about etc.) and hash sync
  useEffect(() => {
    if (!started) return;
    const id = window.location.hash.slice(1);
    if (rooms.some(r => r.id === id)) enterRoom(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);
  useEffect(() => {
    if (!started) return;
    history.replaceState(null, '', panelRoom ? `#${panelRoom}` : window.location.pathname);
  }, [panelRoom, started]);

  const onReady = useCallback(() => setSceneReady(true), []);
  const onFailure = useCallback(() => setSceneFailed(true), []);
  const onLoaded = useCallback(() => setStarted(true), []);
  const onArrive = useCallback(id => setPanelRoom(id), []);
  const onExited = useCallback(() => {}, []);

  const room = rooms.find(r => r.id === panelRoom);
  const RoomView = room ? ROOM_VIEWS[room.id] : null;

  return (
    <div className={`app ${started ? 'is-started' : ''} ${panelRoom ? 'in-room' : ''}`}>
      {!sceneFailed && fontsReady && (
        <Suspense fallback={null}>
          <CorridorScene
            blueprint={blueprint}
            lowPower={lowPower}
            reducedMotion={prefersReducedMotion}
            started={started}
            zTarget={zTarget}
            camZ={camZ}
            activeRoom={activeRoom}
            onSelectRoom={enterRoom}
            onArrive={onArrive}
            onExited={onExited}
            onReady={onReady}
            onFailure={onFailure}
          />
        </Suspense>
      )}
      {sceneFailed && <div className="scene scene--fallback" aria-hidden="true" />}
      <div className="scene-shade" aria-hidden="true" />

      <Preloader ready={sceneReady || sceneFailed} onDone={onLoaded} />
      <Header blueprint={blueprint} onToggleBlueprint={() => setBlueprint(b => !b)} onHome={goHome} onRoom={enterRoom} activeRoom={panelRoom} />

      <main>
        <section ref={introRef} className="intro" aria-labelledby="intro-title">
          <p className="eyebrow mono"><span className="tri" aria-hidden="true" />Portfolio · {profile.title}</p>
          <h1 id="intro-title"><span>{profile.firstName}</span><span>{profile.lastName}</span></h1>
          <p className="intro__lede">{profile.intro}</p>
          <p className="intro__focus mono">{profile.focus}</p>
          <div className="intro__actions">
            <button type="button" className="btn btn--accent" onClick={() => { zTarget.current = clampZ(-3); }}>Start walking</button>
            <button type="button" className="btn btn--ghost" onClick={() => enterRoom('projects')}>View projects</button>
          </div>
        </section>

        {!panelRoom && !busy && started && (
          <div className="walk-hint mono" aria-hidden="true">
            <span className="walk-hint__mouse"><span /></span>
            Scroll or drag to walk · click a door to enter
          </div>
        )}

        {room && (
          <section key={room.id} className={`panel panel--room room--${room.id}`} aria-labelledby="room-title" id={room.id}>
            <button type="button" className="back-btn mono" onClick={leaveRoom}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              Back to corridor
            </button>
            <div id="room-title" className="sr-only-seo">{room.label}</div>
            <RoomView room={room} onOpen={setOpenProject} />
          </section>
        )}
      </main>

      {started && <FloorPlan camZ={camZ} onRoom={enterRoom} activeRoom={panelRoom} />}
      {openProject && <ProjectSheet project={openProject} onClose={() => setOpenProject(null)} />}
    </div>
  );
}
