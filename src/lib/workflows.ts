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
  const w = all.find((x) => x.featured);
  if (!w) throw new Error('no featured workflow in workflow-copy.ts');
  return w;
};

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

/**
 * Steps shown under "How it runs": CEO labels along the main path when the copy sets
 * them, else every visible node name (AI models/parsers excluded) in path order,
 * following each trigger's chain in turn.
 */
export const stepList = (w: Workflow): string[] => {
  if (w.mainPath?.length && w.labels) return mainPath(w).map((n) => nodeLabel(w, n));
  const nodes = visibleNodes(w);
  const edges = mainEdges(w);
  const seen = new Set<string>();
  const order: string[] = [];
  const triggers = nodes
    .filter((n) => isTriggerNode(w, n))
    .sort((a, b) => a.position[1] - b.position[1] || a.position[0] - b.position[0]);
  for (const t of triggers) {
    const queue = [t.name];
    while (queue.length) {
      const cur = queue.shift()!;
      if (seen.has(cur)) continue;
      seen.add(cur);
      order.push(cur);
      queue.push(...edges.filter((e) => e.from === cur).map((e) => e.to));
    }
  }
  const visible = new Set(nodes.map((n) => n.name));
  return order.filter((n) => visible.has(n)).map(sentenceCase);
};

/** One factual line about where a person decides, or null when no step involves one. */
export const controlLine = (w: Workflow): string | null => {
  const human = w.nodes.filter(isHumanNode);
  if (!human.length) return null;
  if (w.slug === 'partnership-operations-automation')
    return 'A person approves in Slack before anything moves.';
  return `A person is part of this one: ${human.map((n) => sentenceCase(n.name).replace(/\?$/, '')).join(', ')}.`;
};
