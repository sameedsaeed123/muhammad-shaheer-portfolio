// All portfolio copy lives here. Edit this file to update the site —
// no component changes are needed.
// NOTE: projects, experience and figures below are starter content.
// Replace them with Muhammad Shaheer's real work before publishing.

export const profile = {
  name: 'Muhammad Shaheer',
  firstName: 'Muhammad',
  lastName: 'Shaheer',
  initials: 'MS',
  title: 'Civil Engineer',
  focus: 'Structural design · Site execution · Quantity surveying',
  location: 'Pakistan · open to remote & on-site work',
  email: 'muhammad.shaheer@example.com',
  phone: '+92 300 0000000',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
    { label: 'Email', href: 'mailto:muhammad.shaheer@example.com' },
  ],
  intro:
    'I design reinforced-concrete structures, check them against code, and follow them onto site until the last slab is cured.',
  greeting: "Hi, I'm Shaheer!",
  greetingSub: 'Scroll to walk the corridor',
  avatar: '/avatar/shaheer-avatar.png',
  portrait: '/avatar/shaheer-portrait.jpg',
  about: [
    'I am a civil engineer working across structural analysis, construction supervision and cost control. My work starts with load paths and ends with a building people can safely occupy.',
    'On the design side I model frames in ETABS and SAFE, detail members to ACI 318, and produce drawings that site teams can actually build from. On site I run setting-out, inspect reinforcement before every pour and keep quantities honest against the BOQ.',
  ],
  stats: [
    { value: '12+', label: 'Structures designed & checked' },
    { value: '4', label: 'Sites supervised' },
    { value: '0', label: 'Lost-time incidents on my pours' },
  ],
};

// The four doors along the corridor. `z` is the door's position down the
// corridor (metres, negative = further in); `side` is the wall it sits in.
// Walkable range of the corridor camera (metres along -z)
export const corridor = { start: 9, end: -47 };

export const rooms = [
  { id: 'about', number: '01', label: 'About Me', side: 'left', z: -7 },
  { id: 'projects', number: '02', label: 'Projects', side: 'right', z: -18 },
  { id: 'activities', number: '03', label: 'Extracurricular', side: 'left', z: -29 },
  { id: 'contact', number: '04', label: 'Contact', side: 'right', z: -40 },
];

export const expertise = [
  {
    code: 'C1',
    title: 'Structural analysis & design',
    body: 'RCC frames, slabs, foundations and retaining walls — modelled, analysed and detailed to ACI 318 / ASCE 7.',
    tools: ['ETABS', 'SAP2000', 'SAFE', 'CSI Detail'],
  },
  {
    code: 'C2',
    title: 'Site execution & supervision',
    body: 'Setting-out, formwork and reinforcement inspection, pour sequencing and daily progress reporting.',
    tools: ['Total station', 'Auto level', 'Pour cards'],
  },
  {
    code: 'C3',
    title: 'Quantity surveying & BOQ',
    body: 'Take-offs from drawings, rate analysis, interim payment certificates and variation tracking.',
    tools: ['Excel', 'PlanSwift', 'CSMI'],
  },
  {
    code: 'C4',
    title: 'Planning & scheduling',
    body: 'Baseline programmes, critical-path tracking and look-ahead plans that site teams can follow.',
    tools: ['Primavera P6', 'MS Project'],
  },
  {
    code: 'C5',
    title: 'Drafting & BIM',
    body: 'Clean working drawings, structural detailing and coordinated 3D models for clash-free construction.',
    tools: ['AutoCAD', 'Revit', 'Civil 3D'],
  },
  {
    code: 'C6',
    title: 'Materials & quality control',
    body: 'Cube and cylinder testing, slump checks, field density tests and non-conformance close-out.',
    tools: ['QA/QC plans', 'ITPs', 'Lab reports'],
  },
];

// `drawing` picks the line drawing shown for each project:
// frame | bridge | road | wall | tank | foundation
export const projects = [
  {
    id: 'g4-commercial',
    sheet: 'S-101',
    title: 'G+4 Commercial Plaza',
    category: 'Structural',
    location: 'Lahore',
    year: '2025',
    role: 'Structural design engineer',
    drawing: 'frame',
    summary:
      'Reinforced-concrete moment frame with flat slabs for a five-storey retail and office block.',
    scope: [
      'ETABS model with seismic and wind load combinations',
      'Flat slab punching-shear checks and drop-panel design in SAFE',
      'Column and beam schedules, bar bending schedule for the contractor',
    ],
    figures: [
      { label: 'Built-up area', value: '3,200 m²' },
      { label: 'Typical span', value: '7.5 m' },
      { label: 'Concrete', value: '4,000 psi' },
    ],
  },
  {
    id: 'residential-supervision',
    sheet: 'S-102',
    title: 'Residential Block Supervision',
    category: 'Site',
    location: 'Islamabad',
    year: '2024',
    role: 'Site engineer',
    drawing: 'foundation',
    summary:
      'Day-to-day supervision of a three-storey residential block from excavation to roof slab.',
    scope: [
      'Setting-out of grid lines and column positions with total station',
      'Reinforcement and formwork inspection before every pour',
      'Daily progress reports and material reconciliation',
    ],
    figures: [
      { label: 'Duration', value: '11 months' },
      { label: 'Pours inspected', value: '38' },
      { label: 'Footings', value: 'Isolated + strap' },
    ],
  },
  {
    id: 'box-culvert',
    sheet: 'S-103',
    title: 'Twin-Cell Box Culvert',
    category: 'Infrastructure',
    location: 'Punjab',
    year: '2024',
    role: 'Design & quantity engineer',
    drawing: 'bridge',
    summary:
      'Hydraulic sizing and structural design of a twin-cell RCC box culvert under a district road.',
    scope: [
      'Hydraulic check for 50-year design discharge',
      'Box section designed for earth pressure and AASHTO HL-93 live load',
      'Bill of quantities and rate analysis for tender',
    ],
    figures: [
      { label: 'Cells', value: '2 × 3.0 m' },
      { label: 'Fill depth', value: '1.8 m' },
      { label: 'Steel', value: 'Grade 60' },
    ],
  },
  {
    id: 'road-rehab',
    sheet: 'S-104',
    title: 'Rural Road Rehabilitation',
    category: 'Infrastructure',
    location: 'Khyber Pakhtunkhwa',
    year: '2023',
    role: 'Assistant quantity surveyor',
    drawing: 'road',
    summary:
      'Pavement rehabilitation with new sub-base, base course and asphalt wearing course.',
    scope: [
      'Cross-section take-offs for cut and fill',
      'Field density and CBR test coordination',
      'Interim payment certificates and measurement books',
    ],
    figures: [
      { label: 'Length', value: '6.4 km' },
      { label: 'Carriageway', value: '7.3 m' },
      { label: 'Wearing course', value: '50 mm' },
    ],
  },
  {
    id: 'retaining-wall',
    sheet: 'S-105',
    title: 'Cantilever Retaining Wall',
    category: 'Geotechnical',
    location: 'Murree',
    year: '2023',
    role: 'Structural design engineer',
    drawing: 'wall',
    summary:
      'RCC cantilever retaining wall stabilising a hillside access road cut.',
    scope: [
      'Stability checks for sliding, overturning and bearing',
      'Stem and base slab design with shear key',
      'Drainage detailing with weep holes and filter media',
    ],
    figures: [
      { label: 'Retained height', value: '5.5 m' },
      { label: 'FoS sliding', value: '1.62' },
      { label: 'Length', value: '85 m' },
    ],
  },
  {
    id: 'overhead-tank',
    sheet: 'S-106',
    title: 'Overhead Water Tank',
    category: 'Water',
    location: 'Faisalabad',
    year: '2022',
    role: 'Final-year design project',
    drawing: 'tank',
    summary:
      'Elevated RCC water tank on a braced column staging for a housing scheme.',
    scope: [
      'Container design to ACI 350 for crack control',
      'Staging analysed for wind and seismic loads',
      'Raft foundation sized against allowable bearing pressure',
    ],
    figures: [
      { label: 'Capacity', value: '50,000 gal' },
      { label: 'Staging height', value: '15 m' },
      { label: 'Columns', value: '8' },
    ],
  },
];

export const experience = [
  {
    elevation: '+8.00',
    period: '2024 — Present',
    role: 'Site / Structural Engineer',
    org: 'General contractor · commercial & residential',
    points: [
      'Supervise RCC works and sign off reinforcement before pours',
      'Prepare monthly IPCs and reconcile quantities against the BOQ',
    ],
  },
  {
    elevation: '+6.00',
    period: '2023 — 2024',
    role: 'Junior Design Engineer',
    org: 'Structural consultancy',
    points: [
      'Modelled and designed RCC buildings in ETABS and SAFE',
      'Produced structural drawings and bar bending schedules',
    ],
  },
  {
    elevation: '+4.00',
    period: '2022',
    role: 'Engineering Intern',
    org: 'Public works department',
    points: ['Road and culvert site inspections, survey and lab testing'],
  },
  {
    elevation: '±0.00',
    period: '2018 — 2022',
    role: 'B.Sc. Civil Engineering',
    org: 'Engineering university',
    points: ['Final-year project: design of an elevated RCC water tank'],
  },
];

export const activities = [
  {
    icon: 'truss',
    title: 'Bridge-model competition',
    role: 'Team lead',
    period: '2021',
    body: 'Designed and built a balsa Warren-truss bridge, then load-tested it to failure. Placed in the top three on load-to-weight ratio.',
  },
  {
    icon: 'people',
    title: 'Civil engineering society',
    role: 'Event coordinator',
    period: '2020 — 2022',
    body: 'Organised technical talks, AutoCAD and ETABS workshops and the annual engineering week for 300+ students.',
  },
  {
    icon: 'helmet',
    title: 'Site visits & technical tours',
    role: 'Organiser',
    period: '2019 — 2022',
    body: 'Arranged visits to a motorway interchange, a hydropower dam and high-rise sites to see design meet construction.',
  },
  {
    icon: 'hands',
    title: 'Community volunteering',
    role: 'Volunteer',
    period: '2022',
    body: 'Helped assess flood-damaged homes and plan safe temporary shelters with a local relief group.',
  },
  {
    icon: 'cricket',
    title: 'University cricket team',
    role: 'All-rounder',
    period: '2018 — 2022',
    body: 'Four seasons of inter-department cricket. Teamwork and composure under pressure, both useful on site.',
  },
  {
    icon: 'cert',
    title: 'Workshops & certifications',
    role: 'Participant',
    period: 'Ongoing',
    body: 'ETABS, SAFE and Primavera P6 training, plus first-aid and site-safety induction courses.',
  },
];
