export const profile = {
  name: 'Jom',
  fullName: 'Jomari Villanueva',
  academicName: 'Jomari Francis B. Villanueva',
  email: 'jomarivillanueva83@gmail.com',
  location: 'Iligan City, Philippines',
  description: 'I connect your tools with Zapier, n8n, and AI so the busywork runs itself.',
  // Google Apps Script web app URL (ends in /exec) for the homepage contact form; see
  // automation/contact-form/SETUP.md. Empty means "not connected yet": the form still renders,
  // and submitting points people to email instead.
  contactEndpoint:
    'https://script.google.com/macros/s/AKfycbw3nKBqqVwsCpCPcLgX5tmVubemliNcUMm7EZC98m-xlsMl15KzKiPmbhzJxP00LcNZEw/exec',
};
export const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jomari-francis-villanueva-63a5a1aa/' },
  { label: 'GitHub', href: 'https://github.com/JomVill' },
  { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=sddXKAgAAAAJ&hl=en&oi=ao' },
  { label: 'Email', href: `mailto:${profile.email}` },
];
export const experience = [
  {
    role: 'Assistant Professor I',
    dates: 'Aug 2024 to Present',
    organization: 'MSU-IIT',
    detail:
      'Department of Computer Applications, College of Computer Studies. Teaching and applied research across IoT, programming, robotics, and computing.',
  },
  {
    role: 'Head of PCETT',
    dates: 'Jan 2025 to Present',
    organization: 'Institute for Policy Innovation and Leadership, MSU-IIT',
    detail:
      'Policy Center for Emerging Trends & Technologies. Work across AI policy, digital governance, technology foresight, and capacity building.',
  },
  {
    role: 'Head of Technology & Research',
    dates: '2022 to 2026',
    organization: 'Future AI Lab / BrandNat',
    detail: 'AI workflows, agents, automation, APIs, content intelligence, and emerging AI technologies.',
  },
  {
    role: 'Project Research Assistant',
    dates: 'Jan 2022 to Jun 2023',
    organization: 'OVCRE, MSU-IIT',
    detail:
      'Developed a microcontroller-based water-level and soil-moisture monitoring and irrigation scheduling system for rice farming. Conducted an empirical survey on smart campus definitions, frameworks, and implementation models.',
  },
  {
    role: 'Co-founder',
    dates: '2022 to Present',
    organization: 'AnIno Solution',
    detail:
      'IoT consultancy working with embedded systems, sensor networks, automation, and applied technology solutions.',
  },
];
export const teaching = [
  'Internet of Things',
  'Applied IoT',
  'Programming for IoT',
  'Data Structures',
  'Operating Systems',
  'Robotics',
  'Data Analytics',
];
export const education = [
  {
    degree: 'MS in Computer Applications',
    institution: 'MSU-Iligan Institute of Technology',
    dates: '2019 to 2022',
    detail: 'DOST-ERDT Scholar',
  },
  {
    degree: 'BS in Computer and Electronics Technology',
    institution: 'MSU-Iligan Institute of Technology',
    dates: '2014 to 2019',
    detail: 'Cum Laude',
  },
];
export const training = [
  {
    title: 'AI READY ASEAN Master Trainer',
    provider: 'SmartCT, AI READY ASEAN Program',
    year: '2025 to Present',
  },
  {
    title: 'Certificate Course on Foresight and Futures Thinking (Batch 14)',
    provider: 'Development Academy of the Philippines, Graduate School of Public and Development Management',
    year: '2025',
  },
  {
    title: 'Certificate Course on Human Rights 101',
    provider: 'Commission on Human Rights: Human Rights Institute, Human Rights Promotion Office',
    year: '2025',
  },
  {
    title: 'Natural Language Processing Training Workshop',
    provider: 'Bicol University & National University in partnership with MSU-IIT',
    year: '2023',
  },
];
export const presentations = [
  {
    title: 'Development of a Low-Cost LoRa-Based System for Particulate Matter 2.5 Data Acquisition',
    event: 'ACDSA 2026',
    type: 'Oral presentation',
    location: 'Boracay Island, Philippines',
    date: '5 to 7 February 2026',
  },
];
export const engagements = [
  {
    title: 'AI Ready ASEAN National Policy Convening',
    date: '29 April 2026',
    role: 'Panelist, DICT Headquarters, Quezon City',
    text: 'Contributed perspectives on AI literacy in education, community engagement, and AI adoption in Mindanao.',
    url: 'https://www.msuiit.edu.ph/news/news-detail.php?id=2477',
  },
  {
    title: 'ASEAN AHEAD & digital safety training',
    date: '18 August 2026',
    role: 'PCETT-IPIL, MSU-IIT',
    text: 'Led PCETT-IPIL’s support for training implementation with SmartCT, CDIIS, and Master Trainers.',
    url: 'https://www.msuiit.edu.ph/news/news-detail.php?id=2550',
  },
];
export const researchInterests = [
  {
    title: 'Connected environments',
    text: 'IoT, sensor networks, AIoT, and environmental data acquisition for smart communities.',
  },
  {
    title: 'AI & society',
    text: 'AI literacy, societal computing, and the relationship between technical capability and social context.',
  },
  {
    title: 'Policy & futures',
    text: 'Technology policy, digital governance, foresight, and emerging technology analysis.',
  },
];

// Products Jom designed and built, shown on the homepage. Only link what is public.
export const projects = [
  {
    name: 'WaterFalse: Iligan Water Watch',
    status: 'Live',
    summary:
      'A community map of where Iligan City has water. Residents report a dry tap or a working source, and an admin checks each report before it shows.',
    stack: 'Next.js, MapLibre, Supabase',
    url: 'https://waterfalse.vercel.app',
    linkLabel: 'Open the live map',
  },
  {
    name: 'Jaryo',
    status: 'Private beta',
    summary:
      'An iPhone app that builds a personal news edition every morning. Rate the stories, and AI drafts social posts from the ones you keep.',
    stack: 'Swift, Supabase, Cloudflare Workers, local AI models',
  },
  {
    name: 'SPINNR Log',
    status: 'In use',
    summary:
      'The daily sales log for SPINNR Launderette. It records each load and payment, totals the day and month, and copies rows straight into the shop spreadsheet.',
    stack: 'HTML, JavaScript, IndexedDB',
  },
];
