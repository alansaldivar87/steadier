import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
test('MCP negotiates, retrieves, stages proposals, rejects invalid amounts', async () => {
  const client = new Client({ name: 'steadier-test', version: '1' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--import', 'tsx', 'scripts/mcp-server.ts'],
    cwd: process.cwd(),
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          (entry): entry is [string, string] => entry[1] !== undefined,
        ),
      ),
      DATABASE_URL: `file:.data/test-mcp-${randomUUID()}.db`,
      HOUSEHOLD_ID: 'mcp-test',
    },
    stderr: 'pipe',
  });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.ok(tools.tools.some((t) => t.name === 'household_snapshot'));
    assert.ok(!tools.tools.some((t) => /payment|accept_draft/.test(t.name)));
    const snapshot = await client.callTool({ name: 'household_snapshot', arguments: {} });
    assert.equal(snapshot.isError, undefined);
    const checkin = await client.callTool({ name: 'money_checkin', arguments: {} });
    assert.equal(checkin.isError, undefined);
    assert.match(JSON.stringify(checkin), /nextStep/);
    const purchase = await client.callTool({
      name: 'check_purchase',
      arguments: { amountCents: 1000 },
    });
    assert.equal(purchase.isError, undefined);
    assert.match(JSON.stringify(purchase), /unknown/);
    assert.equal(
      (await client.callTool({ name: 'check_purchase', arguments: { amountCents: -1 } })).isError,
      true,
    );
    const proposal = await client.callTool({
      name: 'propose_expense',
      arguments: {
        date: '2026-09-10',
        description: 'Test receipt',
        amountCents: 1200,
        accountId: '',
        category: 'Food',
      },
    });
    assert.equal(proposal.isError, undefined);
    const drafts = await client.callTool({ name: 'list_review_drafts', arguments: {} });
    assert.match(JSON.stringify(drafts), /pending/);
    const invalid = await client.callTool({
      name: 'propose_expense',
      arguments: { date: '2026-09-10', description: 'Invalid', amountCents: -1, accountId: '' },
    });
    assert.equal(invalid.isError, true);
    const resource = await client.readResource({ uri: 'steadier://intake' });
    assert.match(JSON.stringify(resource.contents[0]), /forbearance/);
  } finally {
    await client.close();
  }
});
