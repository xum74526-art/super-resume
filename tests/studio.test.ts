import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createStudioServer } from '../src/transports/studio.js';

test('local studio loads its assets and exports selected templates while rejecting cross-origin requests', async () => {
  const server = createStudioServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const headers = { 'Content-Type': 'application/json', 'X-Super-Resume': 'local-studio' };
  const body = JSON.stringify({ resume: { basics: { name: '本地界面验证' } }, template: 'modern', format: 'pdf' });
  try {
    assert((await (await fetch(base)).text()).includes('选择模板'));
    assert((await (await fetch(`${base}/api/config`)).json()).templates.length === 117);
    const specimen=await (await fetch(`${base}/api/sample?id=design`)).json();
    assert.equal(specimen.resume.basics.name,'周予安');
    assert((await fetch(`${base}/api/sample?id=__proto__`)).status===404);
    assert.equal((await fetch(`${base}/studio.js`)).status, 200);
    assert.equal((await fetch(`${base}/studio.css`)).status, 200);
    assert.equal((await fetch(`${base}/api/export`, { method: 'POST', headers: { ...headers, Origin: 'https://outside.example' }, body })).status, 403);
    assert.equal((await fetch(`${base}/api/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })).status, 403);
    assert.equal((await fetch(`${base}/api/export`, { method: 'POST', headers, body: body.replace('modern', 'invalid') })).status, 400);
    const preview = await (await fetch(`${base}/api/preview`, { method: 'POST', headers, body })).json();
    assert.equal(preview.template, 'modern'); assert(preview.pages[0].svg.includes('<svg'));
    const response = await fetch(`${base}/api/export`, { method: 'POST', headers, body });
    assert.equal(response.status, 200); assert.equal(response.headers.get('Content-Type'), 'application/pdf');
    assert(Buffer.from(await response.arrayBuffer()).subarray(0, 5).equals(Buffer.from('%PDF-')));
    const communityBody = JSON.stringify({ resume: { basics: { name: '社区模板测试' } }, template: 'editorial', format: 'html' });
    const htmlResponse = await fetch(`${base}/api/export`, { method: 'POST', headers, body: communityBody });
    assert.equal(htmlResponse.status, 200);
    assert.equal(htmlResponse.headers.get('Content-Type'), 'text/html');
    assert((await htmlResponse.text()).includes('社区模板测试'));
    const unsupported = await fetch(`${base}/api/export`, { method: 'POST', headers, body: communityBody.replace('"html"', '"docx"') });
    assert.equal(unsupported.status, 200);
    const thumb = await fetch(`${base}/api/template-thumbnail?id=editorial`);
    assert.equal(thumb.status, 200);
    assert(thumb.headers.get('Content-Security-Policy')?.includes('sandbox'));
    assert.equal((await fetch(`${base}/api/template-thumbnail?id=../../package.json`)).status, 404);
  } finally { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
});
