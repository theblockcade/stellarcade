export interface ContractEventField {
  name: string;
  type: string;
  isTopic: boolean;
}

export interface ContractEventDef {
  name: string;
  topics: string[];
  fields: ContractEventField[];
  sourceHint?: string;
}

const CONTRACT_EVENT_STRUCT =
  /#\[contractevent\]\s*pub\s+struct\s+(\w+)\s*\{([^}]*)\}/gs;

const FIELD_LINE = /(?:#\[topic\]\s*)?pub\s+(\w+):\s*([^,;\n]+)/g;

const PUBLISH_CALL =
  /(\w+)\s*\{([^}]*)\}\s*\.publish\s*\(\s*&?\s*env\s*\)/g;

const ENV_EVENTS_PUBLISH =
  /env\.events\(\)\.publish\s*\(\s*\(\s*Symbol::new\([^"]*"([^"]+)"[^)]*\)\s*,\s*(\w+)\s*\)\s*,\s*(\w+)\s*\)/g;

function parseStructFields(body: string): ContractEventField[] {
  const fields: ContractEventField[] = [];
  const re = /(#\[topic\]\s*)?pub\s+(\w+):\s*([^\n,;]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    fields.push({
      name: match[2],
      type: match[3].trim(),
      isTopic: Boolean(match[1]),
    });
  }
  return fields;
}

function topicsFromFields(fields: ContractEventField[]): string[] {
  return fields.filter((f) => f.isTopic).map((f) => `${f.name}: ${f.type}`);
}

export function scanContractEvents(sourceCode: string): ContractEventDef[] {
  const events: ContractEventDef[] = [];
  const seen = new Set<string>();

  let structMatch: RegExpExecArray | null;
  CONTRACT_EVENT_STRUCT.lastIndex = 0;
  while ((structMatch = CONTRACT_EVENT_STRUCT.exec(sourceCode)) !== null) {
    const name = structMatch[1];
    const fields = parseStructFields(structMatch[2]);
    const key = `struct:${name}`;
    if (!seen.has(key)) {
      seen.add(key);
      events.push({
        name,
        topics: topicsFromFields(fields),
        fields,
      });
    }
  }

  PUBLISH_CALL.lastIndex = 0;
  let pubMatch: RegExpExecArray | null;
  while ((pubMatch = PUBLISH_CALL.exec(sourceCode)) !== null) {
    const name = pubMatch[1];
    const inner = pubMatch[2];
    const fields: ContractEventField[] = [];
    for (const part of inner.split(',')) {
      const trimmed = part.trim();
      if (!trimmed || trimmed.includes(':')) {
        continue;
      }
      fields.push({ name: trimmed, type: 'inferred', isTopic: false });
    }
    const key = `publish:${name}`;
    if (!seen.has(key)) {
      seen.add(key);
      events.push({
        name,
        topics: fields.map((f) => f.name),
        fields,
        sourceHint: 'publish call',
      });
    }
  }

  ENV_EVENTS_PUBLISH.lastIndex = 0;
  let envMatch: RegExpExecArray | null;
  while ((envMatch = ENV_EVENTS_PUBLISH.exec(sourceCode)) !== null) {
    const name = envMatch[1];
    const topicVar = envMatch[2];
    const payloadVar = envMatch[3];
    events.push({
      name,
      topics: [name, topicVar],
      fields: [{ name: payloadVar, type: 'inferred', isTopic: false }],
      sourceHint: 'env.events().publish',
    });
  }

  return events;
}

export function generateMarkdownCatalog(events: ContractEventDef[]): string {
  if (events.length === 0) {
    return '# Contract Event Catalog\n\n_No events emitted in scanned sources._\n';
  }

  const lines: string[] = ['# Contract Event Catalog', ''];
  for (const event of events) {
    lines.push(`## ${event.name}`);
    if (event.sourceHint) {
      lines.push(`_Source: ${event.sourceHint}_`);
    }
    lines.push('');
    lines.push('### Topics');
    lines.push('');
    if (event.topics.length === 0) {
      lines.push('_None_');
    } else {
      lines.push('| Topic |');
      lines.push('| --- |');
      for (const t of event.topics) {
        lines.push(`| ${t} |`);
      }
    }
    lines.push('');
    lines.push('### Payload fields');
    lines.push('');
    lines.push('| Field | Type | Topic |');
    lines.push('| --- | --- | --- |');
    for (const f of event.fields) {
      lines.push(`| ${f.name} | ${f.type} | ${f.isTopic ? 'yes' : 'no'} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
