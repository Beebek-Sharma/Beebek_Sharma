export type Project = {
  number: string
  title: string
  category: string
  description: string
  technologies: string[]
  visual: 'architecture' | 'platform' | 'rag' | 'nlp'
  repository?: string
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
    title: 'LAN Share',
    category: 'Networked systems',
    description: 'A local WebRTC file-sharing system using a Chrome extension, Native Messaging, Python signaling, and Socket.IO.',
    technologies: ['Python', 'Flask', 'Socket.IO', 'WebRTC', 'Chrome Extension', 'Native Messaging'],
    visual: 'architecture',
    repository: 'https://github.com/Beebek-Sharma/lan-share',
  },
  {
    number: '02',
    title: 'Institute Management System',
    category: 'Full-stack platform',
    description: 'A full-stack institute management platform for courses, instructors, students, enrollment, attendance, certificates, and fees.',
    technologies: ['React', 'Django REST Framework', 'PostgreSQL', 'REST APIs'],
    visual: 'platform',
    repository: 'https://github.com/Beebek-Sharma/Institute_management_system',
  },
  {
    number: '03',
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
  { number: '01', title: 'Football', description: 'Following the sport, playing when I can, and studying the standards of Cristiano Ronaldo — my GOAT.', detail: 'Cristiano Ronaldo / mentality / football' },
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
  phone: '+977-9764186637',
  github: 'https://github.com/Beebek-Sharma',
  linkedin: 'https://www.linkedin.com/in/beebek-sharma-954686331/',
  medium: 'https://medium.com/@bibehsharma777',
  instagram: 'https://www.instagram.com/beebeksharma_7/',
  facebook: 'https://www.facebook.com/S0SUKE',
  resume: '/Beebek_Sharma.pdf',
} as const
