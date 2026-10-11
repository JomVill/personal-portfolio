// CEO-readable copy for each workflow in workflows.json, keyed by workflow id (slug).
// Keys must equal the importer's kebab-case slugs (see scripts/import-n8n.mjs).
export type WorkflowCopy = {
  title: string;
  summary: string;
  tools: string[];
  featured?: boolean;
  /** Shown as a card under "More time-savers" on the homepage (in `order`). */
  homeCard?: boolean;
  /** Small note under the featured diagram (e.g. explaining a dashed edge). */
  featuredNote?: string;
  order: number;
  /** Node names, in order, that make up the story shown on the featured diagram. */
  mainPath?: string[];
  /** Node name → short plain-English label. */
  labels?: Record<string, string>;
  /**
   * Featured-diagram story beats, in order. `through` is the last main-path step (1-based)
   * covered by the beat; the first beat starts at step 1 and each later beat starts right after
   * the previous one. The last beat's `through` must equal the main path's length.
   */
  beats?: { label: string; text: string; through: number }[];
  /**
   * Featured-diagram stream of items. `filterAt` names the main-path node where most items drop
   * out (`keepRate` of them continue). Human nodes always queue items and release them one at a
   * time; `voteKeepRate` is the share that passes the first decision node after the human node.
   * Without `filterAt` every item passes the filter stage.
   */
  flow?: { filterAt?: string; keepRate?: number; voteKeepRate?: number };
  /** Plain-English "How it runs" list on the detail page. */
  steps: string[];
  /** Node name → short label for the full diagram on the detail page. */
  fullLabels: Record<string, string>;
  /** "Where you stay in control" line; the section is omitted when absent. */
  control?: string;
};

export const workflowCopy: Record<string, WorkflowCopy> = {
  'partnership-operations-automation': {
    title: 'Partnership inquiries, handled end to end',
    summary: 'AI screens every inquiry, you approve, and the CRM, contract, and invoice follow.',
    tools: ['Gmail', 'OpenAI', 'Slack', 'HubSpot', 'Trello', 'QuickBooks'],
    order: 5,
    homeCard: true,
    featuredNote: 'Dashed line: after the contract is signed',
    steps: [
      'A partner emails you.',
      "AI reads the inquiry and checks if it's a good fit.",
      'Good fits are sent to you in Slack to approve.',
      'Once approved, the contact and deal are added to HubSpot.',
      'A contract is sent and followed up after 3 days if unsigned.',
      "When it's signed, a project card and invoice are created.",
      'Every Monday, AI writes a short report on open partnerships.',
    ],
    fullLabels: {
      'New Partnership Inquiry': 'New inquiry',
      'AI Screen Inquiry': 'AI checks fit',
      'Mark Inquiry As Read': 'Mark as read',
      'Qualified By AI?': 'Good fit?',
      'Human Review In Slack': 'You review',
      'Approved By Human?': 'Approved?',
      'Save Contact In CRM': 'Add to CRM',
      'Create Partnership Deal': 'Create deal',
      'Create Contract For Signing': 'Send contract',
      'Wait 3 Days': 'Wait 3 days',
      'Check Signing Status': 'Check signing',
      'Still Unsigned?': 'Unsigned?',
      'Send Signing Follow-Up': 'Follow up',
      'Contract Signed Webhook': 'Contract signed',
      'Normalize Signed Contract': 'Tidy contract',
      'Create Project Card': 'Start project',
      'Create Invoice': 'Create invoice',
      'Announce Signed Partnership': 'Announce it',
      'Every Monday 9 AM': 'Every Monday',
      'Get Partnership Deals': 'Get deals',
      'Combine Deals': 'Combine deals',
      'AI Write Weekly Report': 'AI writes report',
      'Post Weekly Report': 'Post report',
    },
    control: 'A person approves in Slack before anything moves.',
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
      { label: 'Inquiry comes in', text: 'A partner emails. No one has to watch the inbox.', through: 1 },
      { label: 'AI does the first read', text: 'Serious leads are sorted from the noise.', through: 3 },
      { label: 'You make the call', text: 'One click in Slack. Nothing moves without you.', through: 5 },
      { label: 'The rest runs itself', text: 'CRM, contract, reminders, and invoice.', through: 10 },
    ],
  },
  'shift-timesheet-reminders-ai-validation': {
    title: 'Timesheets that check themselves',
    summary: 'Staff get reminders before shifts end. Mistakes go straight to a manager.',
    tools: ['Clockify', 'Slack', 'Trello', 'OpenAI'],
    order: 6,
    steps: [
      'Every 15 minutes, it checks who is still clocked in.',
      "If a shift is ending and there's no time entry, the person gets a Slack reminder.",
      "A task is created so the entry isn't forgotten.",
      'Every hour, AI checks new time entries for mistakes.',
      'Anything that looks wrong is flagged to a manager in Slack.',
    ],
    fullLabels: {
      'Every 15 Minutes': 'Every 15 min',
      'Get Running Clockify Timers': "Who's clocked in",
      'Calculate Minutes Left': 'Time left',
      'Ending Soon And No Entry?': 'Missing entry?',
      'Slack Shift-End Reminder': 'Remind person',
      'Create Required Entry Task': 'Create task',
      'Every Hour': 'Every hour',
      'Get Recent Clockify Entries': 'New entries',
      'Split Time Entries': 'One by one',
      'AI Validate Timesheet Entry': 'AI checks entry',
      'Discrepancy Found?': 'Problem?',
      'Slack Flag To Manager': 'Tell manager',
      'Find Slack User': 'Find person',
    },
    control: 'AI only flags problems. A manager decides what to fix.',
  },
  'ai-email-classifier': {
    title: 'Every email reaches the right team',
    summary: 'AI reads incoming mail and routes it to support, billing, or general.',
    tools: ['Gmail', 'OpenAI', 'Slack'],
    order: 7,
    steps: [
      'A new email arrives.',
      "AI reads it and decides what it's about.",
      'Tech issues go to the support channel.',
      'Billing questions go to the billing channel.',
      'Everything else goes to a general channel.',
    ],
    fullLabels: {
      'New Email': 'New email',
      'AI Classify Email': 'AI sorts it',
      'Slack Technical Issue': 'Support',
      'Slack Billing': 'Billing',
      'Slack Other': 'General',
    },
    control: 'Your team sees every email in Slack and decides what to do with it.',
  },
  'article-to-social-content': {
    title: 'One article, ready-to-post social content',
    summary: 'AI writes the caption and image, then queues it for your review.',
    tools: ['OpenAI', 'Placid', 'Buffer', 'Slack'],
    order: 8,
    steps: [
      'A new article is published.',
      'The workflow reads the article.',
      'AI writes a caption and headline.',
      'A branded image is created.',
      'The post is saved as a draft in Buffer.',
      'The team gets a Slack message to review it.',
    ],
    fullLabels: {
      'Article Pushed': 'New article',
      'Fetch Article Page': 'Read article',
      'AI Write Caption And Headline': 'AI writes post',
      'Create Image In Placid': 'Make image',
      'Create Idea In Buffer': 'Save draft',
      'Notify Team In Slack': 'Tell the team',
    },
    control: 'Nothing is posted automatically. The team reviews the draft first.',
  },
  'google-form-to-hubspot-with-10-link-and-1000-contract': {
    title: 'Sign-ups that route themselves',
    summary: 'New form entries land in your CRM and get the right offer or contract automatically.',
    tools: ['Google Sheets', 'HubSpot', 'Gmail', 'OpenAI'],
    order: 9,
    steps: [
      'Someone fills in your sign-up form.',
      "They're added to HubSpot as a contact.",
      'Only people who picked the free option continue.',
      'The workflow checks which offer they picked.',
      'Small offer: they get a payment link by email.',
      'Big offer: a contract is created from your template.',
      'AI drafts a friendly email and sends the contract.',
    ],
    fullLabels: {
      'New Google Form Response': 'New sign-up',
      'Create Contact In HubSpot': 'Add to CRM',
      'Only People Who Selected FREE': 'Free plan?',
      'Route By Offer': 'Which offer?',
      'Send $10 Link Email': 'Send payment link',
      'Format Contract Date': 'Prep contract',
      'Create Contract From Template': 'Create contract',
      'AI Draft Contract Email': 'AI writes email',
      'Send Contract Email': 'Send contract',
    },
  },
  'create-invoice-from-hubspot-to-quickbooks': {
    title: 'Won deals invoice themselves',
    summary: 'When a deal closes, the invoice is created and finance is notified.',
    tools: ['HubSpot', 'QuickBooks', 'Slack'],
    order: 10,
    steps: [
      'A deal is marked as won.',
      'The workflow gathers the deal, company, and line items.',
      'It finds the customer in QuickBooks.',
      'It creates the invoice.',
      'Finance gets a Slack message.',
    ],
    fullLabels: {
      'Deal Stage Changed': 'Deal updated',
      'Only Closed Won': 'Won?',
      'Get Deal With Associations': 'Get deal',
      'Get Company': 'Get company',
      'Find QuickBooks Customer': 'Find customer',
      'Get Deal Line Items': 'Get items',
      'Create QuickBooks Invoice': 'Create invoice',
      'Notify Finance In Slack': 'Tell finance',
    },
  },
  'slack-message-to-clickup': {
    title: 'Chat messages become tasks',
    summary: 'AI turns a Slack message into a ClickUp task with a due date.',
    tools: ['Slack', 'OpenAI', 'ClickUp'],
    order: 11,
    steps: [
      'Someone posts a request in Slack.',
      'AI turns it into a clear task.',
      'The due date is set.',
      'The task is created in ClickUp.',
    ],
    fullLabels: {
      'New Slack Message': 'Slack message',
      'AI Turn Message Into Task': 'AI writes task',
      'Format Due Date': 'Set due date',
      'Create ClickUp Task': 'Create task',
    },
  },
  'set-a-meeting-via-slack': {
    title: 'Meetings booked from a chat message',
    summary: 'AI reads the request, finds the contact, and books a Google Meet.',
    tools: ['Slack', 'OpenAI', 'HubSpot', 'Google Calendar'],
    order: 12,
    steps: [
      'Someone asks for a meeting in Slack.',
      'AI pulls out who, when, and what.',
      'Only real meeting requests continue.',
      'The contact is found in HubSpot.',
      'A Google Meet is booked.',
      'A confirmation is posted in Slack.',
    ],
    fullLabels: {
      'New Slack Message': 'Slack message',
      'AI Extract Meeting Details': 'AI reads request',
      'Only Meeting Requests': 'Meeting?',
      'Find Contact In HubSpot': 'Find contact',
      'Schedule Google Meet': 'Book meeting',
      'Confirm In Slack': 'Confirm',
    },
  },
  'content-pipeline-1-daily-story-scout-score-and-vote': {
    title: 'Your best stories, found and scored every morning',
    summary:
      'AI pulls stories from Hacker News, Reddit, and the web, scores them, and you pick the keepers in Slack.',
    tools: ['Hacker News', 'Reddit', 'OpenAI', 'Slack', 'Google Sheets'],
    order: 1,
    featured: true,
    steps: [
      'Every morning, it pulls new stories from Hacker News, Reddit, and a web search.',
      'Duplicates are removed and the list is trimmed.',
      'AI scores every story.',
      'Only stories above your score threshold continue.',
      'You get each one in Slack with Keep or Kill.',
      'Your vote is logged in Google Sheets.',
      'Kept stories are sent to the content generator.',
    ],
    fullLabels: {
      'Every Morning': 'Every morning',
      'Pipeline Settings': 'Settings',
      'Fetch Hacker News': 'Hacker News',
      'Fetch Reddit': 'Reddit',
      'Fetch Web Search': 'Web search',
      'Normalize Hacker News': 'Clean up',
      'Normalize Reddit': 'Clean up',
      'Normalize Web Search': 'Clean up',
      'Combine Sources': 'Combine',
      'Dedupe And Limit': 'Remove repeats',
      'AI Score Story': 'AI scores it',
      'Keep Stories Above Threshold': 'Worth it?',
      'Ask Human To Vote In Slack': 'You vote',
      'Log Vote': 'Log vote',
      'Was It Kept?': 'Kept?',
      'Send To Content Generator': 'Make content',
    },
    control: 'Nothing moves forward until you vote Keep in Slack.',
    mainPath: [
      'Every Morning',
      'Fetch Hacker News',
      'Combine Sources',
      'Dedupe And Limit',
      'AI Score Story',
      'Keep Stories Above Threshold',
      'Ask Human To Vote In Slack',
      'Log Vote',
      'Was It Kept?',
      'Send To Content Generator',
    ],
    labels: {
      'Every Morning': 'Every morning',
      'Fetch Hacker News': 'Pull stories',
      'Combine Sources': 'Combine',
      'Dedupe And Limit': 'Remove repeats',
      'AI Score Story': 'AI scores it',
      'Keep Stories Above Threshold': 'Worth it?',
      'Ask Human To Vote In Slack': 'You vote',
      'Log Vote': 'Log vote',
      'Was It Kept?': 'Kept?',
      'Send To Content Generator': 'Make content',
    },
    flow: { filterAt: 'Keep Stories Above Threshold', keepRate: 0.35, voteKeepRate: 0.5 },
    beats: [
      { label: 'Stories come in', text: 'Hacker News, Reddit, and the web, every morning.', through: 4 },
      { label: 'AI does the first read', text: 'Each story gets a score. Weak ones drop out.', through: 6 },
      { label: 'You make the call', text: 'Keep or Kill, one tap in Slack.', through: 7 },
      {
        label: 'The rest runs itself',
        text: 'Kept stories become scripts. Your votes teach the AI.',
        through: 10,
      },
    ],
  },
  'content-pipeline-2-content-package-generator': {
    title: 'A story in, a ready-to-film script out',
    summary:
      'AI writes a research brief, a script with hook and captions, reviews it, and saves it to Notion.',
    tools: ['OpenAI', 'Notion', 'Slack'],
    order: 2,
    homeCard: true,
    steps: [
      'A kept story arrives from the Story Scout.',
      'Your brand voice and style are applied.',
      'AI writes a deep-dive brief.',
      'AI writes a script with a hook and captions.',
      'A second AI pass reviews the script.',
      'Everything is saved to a Notion page.',
      'The team gets a Slack message.',
    ],
    fullLabels: {
      'Kept Story Webhook': 'Kept story',
      'Voice And Style': 'Your voice',
      'AI Deep Dive': 'AI research',
      'AI Write Script': 'AI writes script',
      'AI Review Script': 'AI reviews',
      'Save To Notion': 'Save to Notion',
      'Tell Team In Slack': 'Tell the team',
    },
    control: "The team reviews every script in Notion before it's used.",
  },
  'content-pipeline-3-weekly-preference-learning': {
    title: 'An AI that learns your taste',
    summary: 'Every Sunday, AI studies your Keep and Kill votes and suggests better scoring rules.',
    tools: ['Google Sheets', 'OpenAI', 'Slack'],
    order: 3,
    homeCard: true,
    steps: [
      "Every Sunday, it reads the week's votes.",
      'The votes are summarized.',
      'AI looks for patterns in what you kept and killed.',
      'A learning report is posted in Slack.',
      "If the scout's accuracy drops below 60%, you get an alert.",
    ],
    fullLabels: {
      'Every Sunday 9 AM': 'Every Sunday',
      'Read Vote Log': 'Read votes',
      'Summarize Votes': 'Summarize',
      'AI Find Patterns': 'AI finds patterns',
      'Post Weekly Learning Report': 'Post report',
      'Accuracy Below 60 Percent?': 'Accuracy low?',
      'Send Accuracy Alert': 'Alert',
    },
    control: 'New scoring rules only go live after you approve them.',
  },
  'content-pipeline-4-monthly-performance-review': {
    title: 'A monthly check-up on your content engine',
    summary: "On the 1st of each month, AI reviews the month's votes and suggests changes to the scoring.",
    tools: ['Google Sheets', 'OpenAI', 'Slack'],
    order: 4,
    steps: [
      'On the 1st of each month, it reads the last 30 days of votes.',
      'The month is summarized.',
      "AI reviews what worked and what didn't.",
      'Suggested scoring changes are posted in Slack.',
    ],
    fullLabels: {
      '1st Of Month 9 AM': '1st of month',
      'Read Vote Log': 'Read votes',
      'Summarize Month': 'Summarize',
      'AI Monthly Review': 'AI review',
      'Post Monthly Review': 'Post review',
    },
  },
};
