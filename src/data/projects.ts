// Products Jom designed and built: the homepage cards and /projects/<slug>/ pages.
// Facts come from each project's own README and code. Only link what is public.
import type { ImageMetadata } from 'astro';
import type { WorkflowEdge, WorkflowNode } from '../lib/workflows';

import wfLogo from '../assets/projects/waterfalse/logo.png';
import wfPhoneMap from '../assets/projects/waterfalse/phone-map.png';
import wfPhoneLegend from '../assets/projects/waterfalse/phone-legend.png';
import wfPhoneReport from '../assets/projects/waterfalse/phone-report.png';
import wfDesktopMap from '../assets/projects/waterfalse/desktop-map.png';
import wfDesktopLegend from '../assets/projects/waterfalse/desktop-legend.png';
import wfDesktopReport from '../assets/projects/waterfalse/desktop-report.png';
import jaryoLogo from '../assets/projects/jaryo/logo.png';
import jaryoCover from '../assets/projects/jaryo/cover.png';
import jaryoStory from '../assets/projects/jaryo/story.png';
import jaryoReact from '../assets/projects/jaryo/react.png';
import spinnrLogo from '../assets/projects/spinnr-log/logo.png';
import spPhoneDashboard from '../assets/projects/spinnr-log/phone-dashboard.png';
import spPhoneNew from '../assets/projects/spinnr-log/phone-new-sale.png';
import spPhoneTransactions from '../assets/projects/spinnr-log/phone-transactions.png';
import spDesktopDashboard from '../assets/projects/spinnr-log/desktop-dashboard.png';
import spDesktopNew from '../assets/projects/spinnr-log/desktop-new-sale.png';
import spDesktopTransactions from '../assets/projects/spinnr-log/desktop-transactions.png';

export type Shot = { src: ImageMetadata; alt: string; caption: string };

/** The automation behind a project, drawn with the workflow diagram. Steps run left to right. */
export type Automation = {
  intro: string;
  /** Node name → [type, label]. Types follow n8n: 'agent' is an AI step, 'if' a decision, a name with "Human" a person. */
  nodes: [name: string, type: string, label: string][];
  steps: string[];
  control?: string;
};

export type Project = {
  slug: string;
  name: string;
  /** Shorter name for titles, when the full one would wrap. */
  shortName?: string;
  /** One line under the name, like an App Store subtitle. */
  tagline: string;
  /** The fact strip under the header. */
  platform: string;
  category: string;
  account: string;
  /** One or two sentences for the Information table. */
  privacy: string;
  status: string;
  logo: ImageMetadata;
  summary: string;
  stack: string[];
  url?: string;
  linkLabel?: string;
  /** Phone screenshots; with `desktop` too, the page offers a Phone / Desktop switch. */
  shots: Shot[];
  desktop?: Shot[];
  shotsNote?: string;
  automation?: Automation;
  features: string[];
};

export const projects: Project[] = [
  {
    slug: 'waterfalse',
    name: 'WaterFalse: Iligan Water Watch',
    shortName: 'WaterFalse',
    tagline: 'Iligan City’s community water map',
    platform: 'Web, phone and desktop',
    category: 'Community',
    account: 'Not needed',
    privacy:
      'Reports are anonymous and photos are stored privately. An admin reviews every report before it shows.',
    status: 'Live',
    logo: wfLogo,
    summary:
      'Find water in Iligan City before you set out. A live map of fetch points and hydrants, kept up to date by residents. Report a dry tap or a working source from your phone, no account needed.',
    stack: ['Next.js', 'MapLibre', 'Supabase'],
    url: 'https://waterfalse.vercel.app',
    linkLabel: 'Open the live map',
    shots: [
      {
        src: wfPhoneMap,
        alt: 'WaterFalse map of Iligan City with water point pins',
        caption: 'The live map',
      },
      {
        src: wfPhoneLegend,
        alt: 'Map legend: fetch point, fire hydrant, has water, no water',
        caption: 'The legend',
      },
      {
        src: wfPhoneReport,
        alt: 'Report form: no water, has water, fetch point, hydrant, optional note and photo',
        caption: 'Reporting a spot',
      },
    ],
    desktop: [
      {
        src: wfDesktopMap,
        alt: 'WaterFalse on a desktop browser: the full map of Iligan City',
        caption: 'The live map',
      },
      { src: wfDesktopLegend, alt: 'WaterFalse on desktop with the legend open', caption: 'The legend' },
      {
        src: wfDesktopReport,
        alt: 'WaterFalse on desktop with the report form open beside the pin',
        caption: 'Reporting a spot',
      },
    ],
    automation: {
      intro: 'Every report goes through the same path before anyone sees it on the map.',
      nodes: [
        ['Report sent', 'webhook', 'Resident reports'],
        ['Spam limit', 'filter', 'Spam limit'],
        ['Human review', 'set', 'Admin reviews'],
        ['Approved?', 'if', 'Approved?'],
        ['Map updated', 'set', 'Pin updates'],
        ['Seven days', 'if', 'Checked in 7 days?'],
      ],
      steps: [
        'A resident taps the map or uses GPS, picks what they see, and sends it with an optional note and photo.',
        'A rate limit stops floods of reports from one connection. No account or name is needed.',
        'The report waits in the admin queue.',
        'The admin approves it, or rejects it with a reason.',
        'Approved reports update the point’s status and the time it was last checked.',
        'A status not checked in 7 days goes back to unknown, so old news never looks current.',
      ],
      control: 'Nothing reaches the public map until an admin approves it.',
    },
    features: [
      'A legend where every icon has a word beside it.',
      'Search for a barangay, road, or water point.',
      'Barangay boundaries and unofficial pipeline lines you can switch on.',
      'Admin tools for reviews, road status, and change history.',
    ],
  },
  {
    slug: 'jaryo',
    tagline: 'Your morning paper, made for you',
    platform: 'iPhone',
    category: 'News',
    account: 'Email sign-in link',
    privacy:
      'The app holds no API keys. AI requests go through a gateway that checks sign-in and limits each reader.',
    name: 'Jaryo',
    status: 'In beta',
    logo: jaryoLogo,
    summary:
      'Your morning paper, made for you, on iPhone. Swipe through today’s stories, clip the ones you love, and Jaryo drafts your social posts from them. Every swipe shapes tomorrow’s edition.',
    stack: ['Swift', 'Supabase', 'Cloudflare Workers', 'Ollama'],
    shots: [
      {
        src: jaryoCover,
        alt: 'Jaryo cover page: The Jaryo, Morning edition, Read Today’s Edition',
        caption: 'The morning cover',
      },
      {
        src: jaryoStory,
        alt: 'A Jaryo story page with headline, the gist, and key facts',
        caption: 'One story per page',
      },
      {
        src: jaryoReact,
        alt: 'Jaryo rating menu with Dislike, Save, and Like',
        caption: 'Rate it in one tap',
      },
    ],
    shotsNote: 'Screens from the iOS Simulator with test data.',
    automation: {
      intro: 'A press runs on its own every morning and builds one edition per reader.',
      nodes: [
        ['Every morning', 'scheduleTrigger', 'Every morning, 5:30'],
        ['Fetch feeds', 'httpRequest', 'Fetch news feeds'],
        ['Trusted sources', 'filter', 'Trusted sources only'],
        ['Group stories', 'code', 'Group the same story'],
        ['Rank', 'code', 'Rank by your taste'],
        ['Why it matters', 'agent', 'AI writes why it matters'],
        ['Human rates', 'set', 'You rate each story'],
        ['Draft posts', 'agent', 'AI drafts your posts'],
      ],
      steps: [
        'At 5:30 every morning, the press fetches the news feeds.',
        'Only sources on a trusted list count. Community sites show what is buzzing, never what is true.',
        'Reports of the same event are grouped into one story.',
        'Stories are ranked by plain maths against your taste, not by an AI guess.',
        'AI writes a short “why it matters” for each pick, with a link to the original.',
        'You rate each story: Dislike, Save, or Like. Every rating trains tomorrow’s edition.',
        'When you finish, AI drafts posts from the stories you kept, live, step by step.',
      ],
      control: 'Nothing is posted for you. Drafts wait for you to edit and share.',
    },
    features: [
      'One story per page: headline, the gist, and why it was picked for you.',
      'Shows the original headline and links to the publisher. Never the full article, never past a paywall.',
      'AI calls go through a gateway with a daily limit, so the app holds no keys.',
      'Light and dark mode.',
    ],
  },
  {
    slug: 'spinnr-log',
    tagline: 'The daily sales log for a launderette',
    platform: 'Web, saved to the home screen',
    category: 'Business',
    account: 'None, one device',
    privacy: 'Sales are saved in the browser on the shop’s own device. Nothing is sent to a server.',
    name: 'SPINNR Log',
    status: 'In daily use',
    logo: spinnrLogo,
    summary:
      'Every load, every peso, in one place. The shop logs a sale in a few taps, sees who still owes, and copies the day into its spreadsheet. Sales data never leaves the device.',
    stack: ['HTML', 'JavaScript', 'IndexedDB'],
    shots: [
      {
        src: spPhoneDashboard,
        alt: 'SPINNR Log dashboard with income, profit, and expenses for the month',
        caption: 'The month at a glance',
      },
      {
        src: spPhoneNew,
        alt: 'New sale form with customer, service, quantity, and total',
        caption: 'A new sale',
      },
      {
        src: spPhoneTransactions,
        alt: 'Transactions page with today’s sales, income, and amount still owed',
        caption: 'Today’s sales',
      },
    ],
    desktop: [
      {
        src: spDesktopDashboard,
        alt: 'SPINNR Log dashboard on desktop with the sidebar and monthly totals',
        caption: 'The month at a glance',
      },
      { src: spDesktopNew, alt: 'New sale form on desktop with a live sale summary', caption: 'A new sale' },
      {
        src: spDesktopTransactions,
        alt: 'Transactions table on desktop with sortable columns',
        caption: 'Today’s sales',
      },
    ],
    shotsNote: 'Sample data. The shop’s real sales stay on its own device.',
    features: [
      'Add a sale in a few taps. Recent customers are one tap away, and “Maria*3” sets the quantity.',
      'Daily, weekly, and monthly totals, with every unpaid or partial sale in one list.',
      'Copy rows in the shop spreadsheet’s order, or download a CSV.',
      'Import past months from Excel or Google Sheets. Rows already in the log are skipped.',
      'Opens like an app from the home screen. Backups save to a file you keep.',
    ],
  },
];

/** Builds a workflow-diagram object from a project's automation steps, laid out in one row. */
export const automationWorkflow = (p: Project) => {
  const a = p.automation!;
  const nodes: WorkflowNode[] = a.nodes.map(([name, type], i) => ({ name, type, position: [i * 220, 0] }));
  const edges: WorkflowEdge[] = a.nodes
    .slice(1)
    .map(([name], i) => ({ from: a.nodes[i][0], to: name, kind: 'main' }));
  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    nodes,
    edges,
    title: p.name,
    summary: p.summary,
    tools: p.stack,
    order: 0,
    steps: a.steps,
    fullLabels: Object.fromEntries(a.nodes.map(([name, , label]) => [name, label])),
  };
};
