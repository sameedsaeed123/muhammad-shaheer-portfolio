// Small technical line drawings used as project thumbnails.
// Every drawing shares a 320×200 sheet with a ground hatch and a dimension line.

function Hatch({ y = 170, x0 = 10, x1 = 310 }) {
  const ticks = [];
  for (let x = x0; x < x1; x += 10) ticks.push(<line key={x} x1={x} y1={y + 10} x2={x + 8} y2={y} />);
  return (
    <g className="d-thin">
      <line x1={x0} y1={y} x2={x1} y2={y} className="d-mid" />
      {ticks}
    </g>
  );
}

function Dim({ x1, x2, y, label }) {
  return (
    <g className="d-dim">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <line x1={x1 - 3} y1={y + 3} x2={x1 + 3} y2={y - 3} />
      <line x1={x2 - 3} y1={y + 3} x2={x2 + 3} y2={y - 3} />
      <text x={(x1 + x2) / 2} y={y - 5} textAnchor="middle">{label}</text>
    </g>
  );
}

function Frame() {
  const cols = [50, 105, 160, 215, 270];
  const floors = [150, 122, 94, 66, 38];
  return (
    <g>
      <Hatch y={160} />
      {cols.map(x => <rect key={x} x={x - 9} y={160} width={18} height={10} className="d-mid" />)}
      {cols.map(x => <line key={x} x1={x} y1={38} x2={x} y2={160} className="d-thick" />)}
      {floors.map(y => <line key={y} x1={40} y1={y} x2={280} y2={y} className="d-thick" />)}
      {floors.map(y => <text key={y} x={288} y={y + 3} className="d-txt">+{((150 - y) / 28 * 3.6).toFixed(1)}</text>)}
      <Dim x1={50} x2={105} y={22} label="7.50" />
      <Dim x1={105} x2={270} y={22} label="22.50" />
    </g>
  );
}

function Culvert() {
  return (
    <g>
      <path d="M10 60 L110 60 L130 70 L190 70 L210 60 L310 60" className="d-mid" />
      <path d="M10 70 L310 70" className="d-thin dash" />
      <rect x={70} y={95} width={180} height={70} className="d-thick" />
      <rect x={80} y={105} width={75} height={50} className="d-mid" />
      <rect x={165} y={105} width={75} height={50} className="d-mid" />
      <path d="M82 140 Q100 136 118 140 T153 140 M167 140 Q185 136 203 140 T238 140" className="d-thin" />
      <Hatch y={165} />
      <Dim x1={80} x2={155} y={88} label="3.00" />
      <Dim x1={165} x2={240} y={88} label="3.00" />
      <text x={160} y={56} textAnchor="middle" className="d-txt">CL ROAD</text>
    </g>
  );
}

function Road() {
  return (
    <g>
      <path d="M20 120 L60 112 L160 104 L260 112 L300 120" className="d-thick" />
      <path d="M60 112 L160 104 L260 112 L260 118 L160 110 L60 118 Z" className="d-mid fill-soft" />
      <path d="M60 118 L160 110 L260 118 L260 132 L60 132 Z" className="d-mid" />
      <path d="M50 132 L270 132 L280 150 L40 150 Z" className="d-mid" />
      <path d="M20 120 L10 140 M300 120 L310 140" className="d-mid" />
      <Hatch y={160} />
      <text x={160} y={98} textAnchor="middle" className="d-txt">2.5% CAMBER</text>
      <text x={160} y={128} textAnchor="middle" className="d-txt">BASE 150</text>
      <text x={160} y={145} textAnchor="middle" className="d-txt">SUB-BASE 200</text>
      <Dim x1={60} x2={260} y={78} label="7.30" />
    </g>
  );
}

function Wall() {
  const back = [];
  for (let y = 40; y < 150; y += 12) back.push(<line key={y} x1={156} y1={y} x2={176 + (150 - y) * 0.2} y2={y + 10} />);
  return (
    <g>
      <path d="M130 30 L150 30 L156 150 L230 150 L230 168 L80 168 L80 150 L124 150 Z" className="d-thick" />
      <path d="M150 168 L150 182 L166 182 L166 168" className="d-mid" />
      <path d="M156 30 L310 30" className="d-mid" />
      <g className="d-thin">{back}</g>
      {[70, 100, 130].map(y => <circle key={y} cx={140} cy={y} r={3} className="d-mid" />)}
      <path d="M10 150 L80 150" className="d-mid" />
      <text x={250} y={90} className="d-txt">BACKFILL</text>
      <text x={20} y={140} className="d-txt">TOE</text>
      <Dim x1={80} x2={230} y={192} label="4.20" />
      <line x1={110} y1={30} x2={110} y2={150} className="d-dim" />
      <text x={104} y={92} className="d-txt" textAnchor="end">5.50</text>
    </g>
  );
}

function Tank() {
  return (
    <g>
      <path d="M100 30 L220 30 L220 80 L100 80 Z" className="d-thick" />
      <path d="M106 44 L214 44" className="d-thin dash" />
      <path d="M95 30 L160 14 L225 30" className="d-mid" />
      {[110, 160, 210].map(x => <line key={x} x1={x} y1={80} x2={x} y2={162} className="d-thick" />)}
      {[108, 136].map(y => <line key={y} x1={110} y1={y} x2={210} y2={y} className="d-mid" />)}
      <path d="M110 80 L160 108 L210 80 M110 108 L160 136 L210 108 M110 136 L160 162 L210 136" className="d-thin" />
      <rect x={90} y={162} width={140} height={10} className="d-mid" />
      <Hatch y={172} />
      <text x={160} y={64} textAnchor="middle" className="d-txt">50,000 GAL</text>
      <line x1={250} y1={30} x2={250} y2={162} className="d-dim" />
      <text x={256} y={100} className="d-txt">15.0</text>
    </g>
  );
}

function Foundation() {
  const cols = [70, 160, 250];
  return (
    <g>
      {cols.map(x => <line key={`g${x}`} x1={x} y1={10} x2={x} y2={190} className="d-thin dash" />)}
      {[50, 120].map(y => <line key={`h${y}`} x1={20} y1={y} x2={300} y2={y} className="d-thin dash" />)}
      {cols.map(x => [50, 120].map(y => (
        <g key={`${x}${y}`}>
          <rect x={x - 22} y={y - 22} width={44} height={44} className="d-mid" />
          <rect x={x - 7} y={y - 7} width={14} height={14} className="d-thick fill-ink" />
        </g>
      )))}
      <rect x={70} y={116} width={180} height={8} className="d-mid" />
      <text x={160} y={142} textAnchor="middle" className="d-txt">STRAP BEAM</text>
      {cols.map((x, i) => (
        <g key={`b${x}`}>
          <circle cx={x} cy={172} r={10} className="d-mid" />
          <text x={x} y={176} textAnchor="middle" className="d-txt">{'ABC'[i]}</text>
        </g>
      ))}
      <Dim x1={70} x2={160} y={8 + 6} label="6.00" />
    </g>
  );
}

const DRAWINGS = { frame: Frame, bridge: Culvert, road: Road, wall: Wall, tank: Tank, foundation: Foundation };

export default function ProjectDrawing({ type, title }) {
  const Drawing = DRAWINGS[type] || Frame;
  return (
    <svg className="drawing" viewBox="0 0 320 200" role="img" aria-label={`Line drawing: ${title}`}>
      <Drawing />
    </svg>
  );
}
