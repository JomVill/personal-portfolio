// CEO-readable copy for each workflow in workflows.json, keyed by workflow id (slug).
// Keys must equal the importer's kebab-case slugs (see scripts/import-n8n.mjs).
export type WorkflowCopy = {
  title: string;
  summary: string;
  tools: string[];
  featured?: boolean;
  order: number;
  /** Node names, in order, that make up the story shown on the featured diagram. */
  mainPath?: string[];
  /** Node name → short plain-English label. */
  labels?: Record<string, string>;
  beats?: { label: string; text: string }[];
};

export const workflowCopy: Record<string, WorkflowCopy> = {
  'partnership-operations-automation': {
    title: 'Partnership inquiries, handled end to end',
    summary: 'AI screens every inquiry, you approve, and the CRM, contract, and invoice follow.',
    tools: ['Gmail', 'OpenAI', 'Slack', 'HubSpot', 'Trello', 'QuickBooks'],
    featured: true,
    order: 1,
    mainPath: [
      'New Partnership Inquiry',
      'AI Screen Inquiry',
      'Qualified By AI?',
      'Human Review In Slack',
      'Approved By Human?',
      'Save Contact In CRM',
      'Create Contract For Signing',
      'Send Signing Follow-Up',
      'Create Project Card',
      'Create Invoice',
    ],
    labels: {
      'New Partnership Inquiry': 'New inquiry',
      'AI Screen Inquiry': 'AI checks fit',
      'Qualified By AI?': 'Good fit?',
      'Human Review In Slack': 'You review',
      'Approved By Human?': 'Approved?',
      'Save Contact In CRM': 'Add to CRM',
      'Create Contract For Signing': 'Send contract',
      'Send Signing Follow-Up': 'Follow up',
      'Create Project Card': 'Start project',
      'Create Invoice': 'Send invoice',
    },
    beats: [
      { label: 'Inquiry comes in', text: 'A partner emails. No one has to watch the inbox.' },
      { label: 'AI does the first read', text: 'Serious leads are sorted from the noise.' },
      { label: 'You make the call', text: 'One click in Slack. Nothing moves without you.' },
      { label: 'The rest runs itself', text: 'CRM, contract, reminders, and invoice.' },
    ],
  },
  'shift-timesheet-reminders-ai-validation': {
    title: 'Timesheets that check themselves',
    summary: 'Staff get reminders before shifts end. Mistakes go straight to a manager.',
    tools: ['Clockify', 'Slack', 'Trello', 'OpenAI'],
    order: 2,
  },
  'ai-email-classifier': {
    title: 'Every email reaches the right team',
    summary: 'AI reads incoming mail and routes it to support, billing, or general.',
    tools: ['Gmail', 'OpenAI', 'Slack'],
    order: 3,
  },
  'article-to-social-content': {
    title: 'One article, ready-to-post social content',
    summary: 'AI writes the caption and image, then queues it for your review.',
    tools: ['OpenAI', 'Placid', 'Buffer', 'Slack'],
    order: 4,
  },
  'google-form-to-hubspot-with-10-link-and-1000-contract': {
    title: 'Sign-ups that route themselves',
    summary: 'New form entries land in your CRM and get the right offer or contract automatically.',
    tools: ['Google Sheets', 'HubSpot', 'Gmail', 'OpenAI'],
    order: 5,
  },
  'create-invoice-from-hubspot-to-quickbooks': {
    title: 'Won deals invoice themselves',
    summary: 'When a deal closes, the invoice is created and finance is notified.',
    tools: ['HubSpot', 'QuickBooks', 'Slack'],
    order: 6,
  },
  'slack-message-to-clickup': {
    title: 'Chat messages become tasks',
    summary: 'AI turns a Slack message into a ClickUp task with a due date.',
    tools: ['Slack', 'OpenAI', 'ClickUp'],
    order: 7,
  },
  'set-a-meeting-via-slack': {
    title: 'Meetings booked from a chat message',
    summary: 'AI reads the request, finds the contact, and books a Google Meet.',
    tools: ['Slack', 'OpenAI', 'HubSpot', 'Google Calendar'],
    order: 8,
  },
};
