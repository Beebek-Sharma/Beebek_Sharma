export type ProjectScreenshot = {
  id: string
  label: string
  src: string
  alt: string
  caption: string
}

export type Project = {
  number: string
  title: string
  category: string
  description: string
  technologies: string[]
  visual?: 'architecture' | 'platform' | 'rag' | 'nlp'
  repository?: string
  liveUrl?: string
  bannerImage?: string
  screenshots?: ProjectScreenshot[]
  highlights?: string[]
}

export type Experience = {
  period: string
  company: string
  role: string
  description: string
}

export const projects: Project[] = [
  {
    number: '01',
    title: 'MyDM',
    category: 'Browser engine & network systems',
    description: 'A high-performance Manifest V3 download manager featuring a deterministic 12-state lifecycle machine, smart concurrency queue, HLS/DASH media stream detection, and optional Python native messaging host.',
    technologies: ['JavaScript', 'Chrome MV3', 'Web APIs', 'Python', 'Native Messaging', 'Streaming Engine'],
    visual: 'architecture',
    repository: 'https://github.com/Beebek-Sharma/My_DM',
    bannerImage: '/projects/mydm-dashboard.png',
    screenshots: [
      {
        id: 'dashboard',
        label: 'Downloads Dashboard',
        src: '/projects/mydm-dashboard.png',
        alt: 'MyDM Downloads Dashboard — Active queue, chunk telemetry, and state machine',
        caption: 'Live Downloads Dashboard from GitHub README showing active queue telemetry, chunk tracking, and SHA-256 integrity verification.',
      },
      {
        id: 'sniffer',
        label: 'Media Sniffer',
        src: '/projects/mydm-sniffer.png',
        alt: 'MyDM Media Sniffer — Stream inspection and HLS/DASH capture',
        caption: 'Active Stream Inspector detecting and capturing multimedia streams in real time.',
      },
      {
        id: 'settings',
        label: 'Settings Preferences',
        src: '/projects/mydm-settings.png',
        alt: 'MyDM Settings & Engine Preferences — Concurrency control and protocols',
        caption: 'Engine configuration interface for thread limits, retry backoff, and native messaging bridge.',
      },
      {
        id: 'architecture',
        label: 'Architecture Diagram',
        src: '/projects/mydm-architecture.svg',
        alt: 'MyDM 12-State Machine and Engine Architecture',
        caption: 'Deterministic state machine lifecycle, concurrent chunk worker pool, and native IPC messaging.',
      },
    ],
    highlights: ['Deterministic 12-State Machine', 'HTTP Range Resumption', 'HLS & DASH Stream Sniffer', 'Zero-Telemetry & 100% Local'],
  },
  {
    number: '02',
    title: 'LAN Share',
    category: 'Networked systems',
    description: 'A local WebRTC file-sharing system using a Chrome extension, Native Messaging host, Python signaling server, and Socket.IO for direct high-throughput peer-to-peer data channels.',
    technologies: ['Python', 'Flask', 'Socket.IO', 'WebRTC', 'Chrome Extension', 'Native Messaging'],
    visual: 'architecture',
    repository: 'https://github.com/Beebek-Sharma/lan-share',
    bannerImage: '/projects/lanshare-desktop.png',
    screenshots: [
      {
        id: 'desktop',
        label: 'Desktop Web Client',
        src: '/projects/lanshare-desktop.png',
        alt: 'LAN Share Desktop Web Client — Direct WebRTC P2P Transfer Interface',
        caption: 'Desktop web client from GitHub README with instant room discovery, peer presence, and zero-cloud transfer.',
      },
      {
        id: 'extension',
        label: 'Extension Popup',
        src: '/projects/lanshare-extension.png',
        alt: 'LAN Share Chrome Extension Popup — Server orchestrator and LAN detector',
        caption: 'Browser extension popup controller for triggering Python native daemon and local port forwarding.',
      },
      {
        id: 'phone',
        label: 'Mobile Web UI',
        src: '/projects/lanshare-phone.png',
        alt: 'LAN Share Mobile Web Interface — Responsive QR-scanned P2P peer view',
        caption: 'Mobile client interface connected via QR code scanning over local Wi-Fi / hotspot.',
      },
      {
        id: 'architecture',
        label: 'Architecture Diagram',
        src: '/projects/lanshare-architecture.svg',
        alt: 'LAN Share P2P WebRTC DataChannel Architecture',
        caption: 'Full-duplex WebRTC data channels with Flask-SocketIO signaling protocol.',
      },
    ],
    highlights: ['Direct WebRTC DataChannel', 'Local Flask-SocketIO Signaling', 'Zero Cloud Transit', 'Direct OS Disk Streaming'],
  },
  {
    number: '03',
    title: 'EduConnect',
    category: 'Full-stack platform',
    description: 'A full-stack educational platform for university and course discovery, featuring dual student/admin workflows, course comparison, interactive maps, and JWT session handling.',
    technologies: ['React', 'Django REST Framework', 'Tailwind CSS', 'PostgreSQL', 'Google OAuth', 'JWT'],
    visual: 'platform',
    repository: 'https://github.com/Beebek-Sharma/EduConnect',
    liveUrl: 'https://educonnect-app-production.up.railway.app/',
    bannerImage: '/projects/educonnect-home.png',
    screenshots: [
      {
        id: 'home',
        label: 'Discovery Portal',
        src: '/projects/educonnect-home.png',
        alt: 'EduConnect Homepage Discovery Portal',
        caption: 'Live course discovery and interactive university comparison portal.',
      },
      {
        id: 'admin',
        label: 'Admin Dashboard',
        src: '/projects/educonnect-admin.png',
        alt: 'EduConnect Admin Operations Dashboard',
        caption: 'Administrative console for managing programs, faculties, and institutions.',
      },
      {
        id: 'university',
        label: 'University Directory',
        src: '/projects/educonnect-university.png',
        alt: 'EduConnect University Directory',
        caption: 'Interactive catalog of top universities with geolocated maps.',
      },
    ],
    highlights: ['Dual Student & Admin Workflows', 'Side-by-Side Course Comparison', 'JWT Token Rotation & OAuth', 'Live Production Deployment'],
  },
  {
    number: '04',
    title: 'Institute Management System',
    category: 'Full-stack platform',
    description: 'A comprehensive operations platform built for physical and hybrid institutes, handling courses, batches, schedule timetables, attendance tracking, and student fee accounting.',
    technologies: ['React 19', 'Django REST Framework', 'Tailwind CSS', 'PostgreSQL', 'Framer Motion', 'Radix UI'],
    visual: 'platform',
    repository: 'https://github.com/Beebek-Sharma/Institute_management_system',
    liveUrl: 'https://instituemanagementsystem-production.up.railway.app/',
    bannerImage: '/projects/ims-live.png',
    highlights: ['Multi-Role RBAC (Admin, Staff, Instructor, Student)', 'Batch & Class Schedule Engine', 'Payment Verification & Receipts', 'Live Production Deployment'],
  },
  {
    number: '05',
    title: 'Sticky Notes',
    category: 'Interactive 2D canvas',
    description: 'A tactile, full-stack sticky notes board featuring a responsive 2D drag-and-drop canvas, debounced auto-sync, color-coded tag organization, and persistent SQLite REST persistence.',
    technologies: ['React', 'Django REST Framework', 'REST APIs', 'Pointer Events', 'Axios', 'SQLite'],
    visual: 'platform',
    repository: 'https://github.com/Beebek-Sharma/Sticky_Notes',
    liveUrl: 'https://stickynotes-production-7b8a.up.railway.app/',
    bannerImage: '/projects/stickynotes-live.png',
    highlights: ['Pointer-Event 2D Canvas Dragging', 'Debounced Auto-Save Engine', 'Color Palette Enforcement', 'Live Production Deployment'],
  },
  {
    number: '06',
    title: 'Medium',
    category: 'Full-stack publishing',
    description: 'A production Django publishing platform featuring user authentication, profile picture processing and automatic thumbnailing, full CRUD post authoring, and SMTP email password recovery.',
    technologies: ['Python', 'Django', 'Bootstrap 4', 'Crispy Forms', 'Pillow', 'PostgreSQL'],
    visual: 'platform',
    repository: 'https://github.com/Beebek-Sharma/Medium',
    liveUrl: 'https://medium-production-a9db.up.railway.app/',
    bannerImage: '/projects/medium-live.png',
    highlights: ['User Auth & Profile Customization', 'Automatic Image Resizing & Processing', 'CRUD Editorial Publishing', 'Live Production Deployment'],
  },
  {
    number: '07',
    title: 'Expense Tracker API',
    category: 'Backend API',
    description: 'A secure expense-management API with token authentication, user authorization, currency conversion, and budget monitoring.',
    technologies: ['Django REST Framework', 'PostgreSQL', 'Token authentication', 'CRUD'],
    visual: 'platform',
    repository: 'https://github.com/Beebek-Sharma/Expense-Tracker-API',
  },
]

export const experience: Experience[] = [
  {
    period: 'Nov 2025 — Feb 2026',
    company: 'Lunar I.T. Solution Pvt. Ltd.',
    role: 'Django Developer Intern',
    description: 'Developed Django and Django REST Framework modules and APIs, worked with relational databases and Linux systems, and collaborated through Git-based workflows.',
  },
]

export const labGroups = [
  { label: 'AI / LLM', topics: ['RAG', 'NLP', 'LLM APIs', 'Transformers'], detail: 'Retrieval pipelines, context injection, and practical intelligent applications.' },
  { label: 'Backend', topics: ['Django', 'DRF', 'FastAPI', 'APIs'], detail: 'Business logic, service boundaries, data modeling, and reliable interfaces.' },
  { label: 'Systems', topics: ['Linux', 'Networking', 'WebRTC', 'WebSockets'], detail: 'The protocols and infrastructure underneath connected products.' },
  { label: 'Build', topics: ['React', 'Automation', 'Databases', 'Docker'], detail: 'End-to-end product work, from interface to deployment-minded tooling.' },
]

export const interests = [
  { number: '01', title: 'Football', description: 'Following the sport, playing when I can, and studying the standards of Cristiano Ronaldo — The GOAT.', detail: 'Cristiano Ronaldo / mentality / football' },
  { number: '02', title: 'Anime', description: 'One Piece is my GOAT anime, with Dragon Ball, Bleach, and Naruto close behind.', detail: 'One Piece / Dragon Ball / Bleach / Naruto' },
  { number: '03', title: 'Gaming', description: 'PC and mobile gaming, mostly shooting games like PUBG, Call of Duty, and whatever the community is playing.', detail: 'PC / mobile / competitive shooters' },
  { number: '04', title: 'Reading', description: 'Novels, books, manga, manhua, manhwa, and comics — any format with a world worth getting lost in.', detail: 'Books / manga / manhua / manhwa / comics' },
  { number: '05', title: 'Web novels', description: 'Reverend Insanity and Fang Yuan are the standout favorites, alongside Lord of Mysteries, Shadow Slave, ORV, and The Beginning After the End.', detail: 'Reverend Insanity / Lord of Mysteries / Shadow Slave / ORV / TBATE' },
  { number: '06', title: 'Technology', description: 'Operating systems, hardware, networking, AI/ML, and emerging tools.', detail: 'Linux / systems / hardware / AI / ML / networking' },
]

export const techStack = [
  ['Languages', 'Python · JavaScript · C/C++ · SQL'],
  ['Frontend', 'HTML · CSS · JavaScript · React.js · Vite · Tailwind CSS · Responsive Web Design'],
  ['Backend', 'Django · Django REST Framework · FastAPI · Flask · REST APIs · Authentication · CRUD Operations · Flask-SocketIO'],
  ['AI / LLM', 'LLMs · RAG · LangChain · Azure OpenAI · NLP · Vector Databases'],
  ['Databases', 'PostgreSQL · MySQL · SQLite · Vector Databases'],
  ['Networking', 'TCP/IP · LAN/WAN · Wi-Fi Configuration · Router Configuration · Hardware and Software Troubleshooting · WebRTC'],
  ['Tools', 'Git · GitHub · Docker · Linux · Windows · REST API Testing · Virtual Environments · CI/CD'],
] as const

export const links = {
  email: 'bibeksharma976@gmail.com',
  github: 'https://github.com/Beebek-Sharma',
  linkedin: 'https://www.linkedin.com/in/beebek-sharma-954686331/',
  medium: 'https://medium.com/@bibehsharma777',
  instagram: 'https://www.instagram.com/beebeksharma_7/',
  facebook: 'https://www.facebook.com/S0SUKE',
  resume: '/Beebek_Sharma.pdf',
} as const
