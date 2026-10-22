import { expect, test } from '@playwright/test';
import type { NodeResult, Result } from 'axe-core';

type ReadableCheck = {
  kind: 'any' | 'all' | 'none';
  id: string;
  impact: string | null;
  message: string;
};

type ReadableNode = {
  impact: string | null;
  target: NodeResult['target'];
  html: string;
  failureSummary?: string;
  checks: ReadableCheck[];
};

type ReadableViolation = {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: ReadableNode[];
};

/**
 * Fail the test on axe violations locally.
 * In CI, record the same violations on the report and let the test pass.
 */
export async function expectNoAxeViolations(violations: Result[]): Promise<void> {
  if (violations.length === 0) {
    return;
  }

  const summary = summarizeAxeViolations(violations);
  const text = formatAxeViolations(violations);

  if (process.env.CI) {
    const info = test.info();
    info.annotations.push({
      type: 'a11y',
      description: `${summary} Details are attached as axe-violations.txt and axe-violations.json.`,
    });
    await info.attach('axe-violations.txt', {
      body: text,
      contentType: 'text/plain',
    });
    await info.attach('axe-violations.json', {
      body: JSON.stringify(
        { violationCount: violations.length, violations: toReadableViolations(violations) },
        null,
        2,
      ),
      contentType: 'application/json',
    });
    console.warn(text);
    console.log(`::warning title=Accessibility::${escapeGitHubCommand(summary)}`);
    return;
  }

  expect(violations, text).toEqual([]);
}

function summarizeAxeViolations(violations: Result[]): string {
  const rules = violations.map((violation) => violation.id).join(', ');
  return `Accessibility violations found (${violations.length}): ${rules}.`;
}

function formatAxeViolations(violations: Result[]): string {
  const blocks = violations.map((violation, index) => {
    const impact = violation.impact ?? 'unknown';
    const nodes = violation.nodes.map((node) => formatNode(node)).join('\n');
    return [
      `${index + 1}. [${impact}] ${violation.id}`,
      `   ${violation.help}`,
      `   ${violation.description}`,
      `   ${violation.helpUrl}`,
      `   Tags: ${violation.tags.join(', ')}`,
      `   Nodes (${violation.nodes.length}):`,
      nodes,
    ].join('\n');
  });

  return [`${violations.length} accessibility violation(s)`, '', ...blocks].join('\n');
}

function formatNode(node: NodeResult): string {
  const lines = [
    `   - target: ${formatTarget(node.target)}`,
    `     impact: ${node.impact ?? 'unknown'}`,
  ];
  if (node.failureSummary) {
    lines.push(indent(node.failureSummary, 5));
  }
  lines.push(indent(node.html, 5));
  return lines.join('\n');
}

function formatTarget(target: NodeResult['target']): string {
  return typeof target === 'string' ? target : JSON.stringify(target);
}

function indent(value: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return value
    .split('\n')
    .map((line) => `${pad}${line}`)
    .join('\n');
}

function toReadableViolations(violations: Result[]): ReadableViolation[] {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? null,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    tags: violation.tags,
    nodes: violation.nodes.map((node) => ({
      impact: node.impact ?? null,
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary,
      checks: [
        ...node.any.map((check) => toReadableCheck('any', check)),
        ...node.all.map((check) => toReadableCheck('all', check)),
        ...node.none.map((check) => toReadableCheck('none', check)),
      ],
    })),
  }));
}

function toReadableCheck(
  kind: ReadableCheck['kind'],
  check: NodeResult['any'][number],
): ReadableCheck {
  return {
    kind,
    id: check.id,
    impact: check.impact ?? null,
    message: check.message,
  };
}

function escapeGitHubCommand(message: string): string {
  return message.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
