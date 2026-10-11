import data from '../data/workflows.json';
import { workflowCopy, type WorkflowCopy } from '../data/workflow-copy';

export type WorkflowNode = { name: string; type: string; position: [number, number] };
export type WorkflowEdge = { from: string; to: string; kind: string };
export type Workflow = {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  slug: string;
} & WorkflowCopy;

type RawWorkflow = {
  id: string;
  name: string;
  nodes: { name: string; type: string; position: number[] }[];
  edges: WorkflowEdge[];
};

const all: Workflow[] = (data as RawWorkflow[])
  .map((w) => {
    const copy = workflowCopy[w.id];
    if (!copy) throw new Error(`workflow-copy.ts has no entry for "${w.id}"`);
    const nodes = w.nodes.map((n) => ({
      ...n,
      position: [n.position[0], n.position[1]] as [number, number],
    }));
    return { ...w, nodes, ...copy, slug: w.id };
  })
  .sort((a, b) => a.order - b.order);

export const getWorkflows = (): Workflow[] => all;
export const getWorkflow = (slug: string): Workflow | undefined => all.find((w) => w.slug === slug);
export const featured = (): Workflow => {
  const list = all.filter((x) => x.featured);
  if (list.length !== 1)
    throw new Error(`workflow-copy.ts needs exactly one featured workflow, has ${list.length}`);
  return list[0];
};
/** Cards under "More time-savers" on the homepage: copy entries flagged `homeCard`, in order. */
export const homeCards = (): Workflow[] => all.filter((x) => x.homeCard);

// ---- node classification ----

const AI_TYPES = new Set([
  'agent',
  'textClassifier',
  'chainLlm',
  'informationExtractor',
  'sentimentAnalysis',
]);
const DECISION_TYPES = new Set(['if', 'filter', 'switch']);

export const isAiNode = (n: WorkflowNode) => AI_TYPES.has(n.type) || n.type.startsWith('openAi');
export const isHumanNode = (n: WorkflowNode) => /Human|Approved/.test(n.name);
export const isDecisionNode = (n: WorkflowNode) => DECISION_TYPES.has(n.type);

/** Sub-nodes (models, parsers, memory, tools) that only feed an AI node; drawn folded into it. */
export const isSubNode = (w: Workflow, n: WorkflowNode) => {
  const out = w.edges.filter((e) => e.from === n.name);
  return out.length > 0 && out.every((e) => e.kind !== 'main');
};

export const visibleNodes = (w: Workflow) => w.nodes.filter((n) => !isSubNode(w, n));
export const mainEdges = (w: Workflow) => w.edges.filter((e) => e.kind === 'main');

export const isTriggerNode = (w: Workflow, n: WorkflowNode) =>
  !isSubNode(w, n) && !mainEdges(w).some((e) => e.to === n.name);

/** True when `to` can be reached from `from` along main connections. */
export const reachable = (w: Workflow, from: string, to: string) => {
  const edges = mainEdges(w);
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) return true;
    for (const e of edges)
      if (e.from === cur && !seen.has(e.to)) {
        seen.add(e.to);
        queue.push(e.to);
      }
  }
  return false;
};

/**
 * Node names along the workflow's main path: the copy's `mainPath` when set, otherwise
 * the first branch followed from the top-left trigger.
 */
export const mainPath = (w: Workflow): string[] => {
  if (w.mainPath?.length) return w.mainPath;
  const nodes = visibleNodes(w);
  const triggers = nodes
    .filter((n) => isTriggerNode(w, n))
    .sort((a, b) => a.position[1] - b.position[1] || a.position[0] - b.position[0]);
  const start = triggers[0] ?? nodes[0];
  if (!start) return [];
  const edges = mainEdges(w);
  const path = [start.name];
  for (;;) {
    const next = edges.find((e) => e.from === path[path.length - 1] && !path.includes(e.to));
    if (!next) return path;
    path.push(next.to);
  }
};

/**
 * Beat index (0-based) for each main-path step, from the copy's `beats[].through`.
 * Throws when the beats do not cover the main path exactly, so a stale mapping fails the build.
 */
export const beatIndexes = (w: Workflow): number[] => {
  const beats = w.beats ?? [];
  const steps = mainPath(w).length;
  if (!beats.length) return [];
  let prev = 0;
  for (const b of beats) {
    if (!(b.through > prev)) throw new Error(`${w.id}: beat "${b.label}" must run past step ${prev}`);
    prev = b.through;
  }
  if (prev !== steps) throw new Error(`${w.id}: beats cover ${prev} steps, main path has ${steps}`);
  return Array.from({ length: steps }, (_, i) => beats.findIndex((b) => i + 1 <= b.through));
};

/**
 * Stream settings for the featured animation: the main-path step where items are filtered
 * (-1 when none) and the share kept there and at the vote. Throws when `filterAt` is off the path.
 */
export const flowOf = (w: Workflow) => {
  const f = w.flow ?? {};
  const filterStep = f.filterAt ? mainPath(w).indexOf(f.filterAt) : -1;
  if (f.filterAt && filterStep < 0)
    throw new Error(`${w.id}: flow.filterAt "${f.filterAt}" is not on the main path`);
  const rate = (v: number | undefined) => Math.min(Math.max(v ?? 1, 0), 1);
  return { filterStep, keepRate: rate(f.keepRate), voteKeepRate: rate(f.voteKeepRate) };
};

/** Short display label for a node: the copy's CEO label when present, else the node name. */
export const nodeLabel = (w: Workflow, name: string) => w.labels?.[name] ?? name;

// ---- plain-English steps for the detail page ----

/** Words that keep their capitals when a node name is turned into sentence case. */
const KEEP_CASE = new Set([
  'Slack',
  'HubSpot',
  'QuickBooks',
  'Gmail',
  'Google',
  'Meet',
  'Clockify',
  'ClickUp',
  'Trello',
  'Placid',
  'Buffer',
  'Monday',
  'AI',
  'CRM',
  'AM',
  'PM',
  'FREE',
]);

/** "New Email" → "New email"; "Qualified By AI?" → "Qualified by AI?". */
export const sentenceCase = (name: string) =>
  name
    .split(/\s+/)
    .map((word, i) => {
      if (i === 0) return word;
      const bare = word.replace(/[^A-Za-z]/g, '');
      return KEEP_CASE.has(bare) || /[A-Z].*[A-Z]/.test(bare) ? word : word.toLowerCase();
    })
    .join(' ');

/** Label for the full diagram: the copy's `fullLabels` entry, else the sentence-cased name. */
export const fullLabel = (w: Workflow, name: string) => w.fullLabels?.[name] ?? sentenceCase(name);
