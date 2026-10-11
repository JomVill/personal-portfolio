export type ChannelId = 'automation' | 'research' | 'policy' | 'teaching';
export const channels = [
  {
    id: 'automation',
    code: 'CH1',
    name: 'Automation',
    route: 'automation/',
    blurb: 'AI workflows and agents I build for real work.',
  },
  {
    id: 'research',
    code: 'CH2',
    name: 'Research',
    route: 'research/',
    blurb: 'Societal computing: how sensing and AI land in communities.',
  },
  {
    id: 'policy',
    code: 'CH3',
    name: 'Policy',
    route: 'policy/',
    blurb: 'Helping institutions decide how to adopt technology.',
  },
  {
    id: 'teaching',
    code: 'CH4',
    name: 'Teaching',
    route: 'teaching/',
    blurb: 'Computing courses and AI literacy training.',
  },
] as const satisfies readonly { id: ChannelId; code: string; name: string; route: string; blurb: string }[];
export const channelById = (id: ChannelId) => channels.find((c) => c.id === id)!;
