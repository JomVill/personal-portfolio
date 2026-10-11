import type { ChannelId } from './channels';

export const projects = [
  {
    slug: 'applied-ai',
    channel: 'automation' as ChannelId,
    number: '01',
    category: 'AI AUTOMATION',
    title: 'AI workflows that connect research and operations.',
    organization: 'Future AI Lab / BrandNat',
    role: 'Head of Technology & Research · 2022–2026',
    summary: 'Connecting AI workflows, agents, and APIs to the work organizations do every day.',
    objective:
      'Explore how emerging AI technologies can support organizational workflows and AI-assisted operations.',
    contribution:
      'Designed and implemented AI-powered workflows, multi-agent systems, and automation pipelines supporting content production and audience intelligence. The work connected applied AI research with media practice.',
    methods: ['Zapier & n8n', 'Agents & APIs', 'LLM workflows'],
    result:
      'This work brings technical implementation and research into the same practice. Specific client implementations and performance results are not publicly documented here.',
    visual: 'workflow',
    link: null,
  },
  {
    slug: 'ai-literacy-policy',
    channel: 'teaching' as ChannelId,
    number: '02',
    category: 'TECHNOLOGY & SOCIETY',
    title: 'AI literacy for an informed society.',
    organization: 'PCETT / AI READY ASEAN',
    role: 'Head of PCETT · Certified AI READY ASEAN Master Trainer',
    summary: 'Bringing AI literacy, educator capacity building, and technology policy into conversation.',
    objective:
      'Support people and institutions in understanding AI and participating in decisions about its use.',
    contribution:
      'Leads PCETT’s work across emerging technology policy and capacity building. Participated as a panelist in the AI Ready ASEAN National Policy Convening and led PCETT-IPIL’s support for regional training implementation.',
    methods: ['AI literacy', 'Capacity building', 'Technology policy'],
    result:
      'Documented engagements include the April 2026 national policy convening and the August 2026 ASEAN AHEAD and digital safety training at MSU-IIT.',
    visual: 'society',
    link: 'https://www.msuiit.edu.ph/news/news-detail.php?id=2477',
  },
  {
    slug: 'digital-government',
    channel: 'policy' as ChannelId,
    number: '03',
    category: 'DIGITAL GOVERNANCE',
    title: 'A digital direction for Iligan City.',
    organization: 'City Government of Iligan',
    role: 'Information systems planning and development activities',
    summary: 'Development work related to Iligan City’s Information Systems Strategic Plan.',
    objective: 'Connect information systems planning with public-sector needs and digital transformation.',
    contribution:
      'Spearheaded development of Iligan City’s Information Systems Strategic Plan through work at PCETT, connecting digital governance with information systems planning.',
    methods: ['ISSP', 'Digital government', 'Technology strategy'],
    result:
      'The plan is the city’s roadmap for information systems. Implementation status is not documented here.',
    visual: 'governance',
    link: null,
  },
  {
    slug: 'environmental-sensing',
    channel: 'research' as ChannelId,
    number: '04',
    category: 'IoT & APPLIED COMPUTING',
    title: 'Low-cost sensing. Connected environments.',
    organization: 'Applied research / MSU-IIT',
    role: 'First author · LoRa-based PM2.5 research',
    summary: 'Low-cost sensing and LoRa communication for particulate matter data acquisition.',
    objective: 'Investigate a low-cost LoRa-based system for acquiring particulate matter 2.5 data.',
    contribution:
      'Co-authored research on a LoRa-based PM2.5 data acquisition system, connecting environmental sensing with applied computing.',
    methods: ['LoRa', 'Environmental sensing', 'IoT'],
    result:
      'Published in the 2026 International Conference on Artificial Intelligence, Computer, Data Sciences and Applications (ACDSA).',
    visual: 'sensing',
    link: 'https://doi.org/10.1109/ACDSA67686.2026.11468017',
  },
];
