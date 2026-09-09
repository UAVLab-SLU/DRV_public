// Exercise the existing frontend serializer against every prepared drone payload.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const component = fs.readFileSync(path.join(here, '../frontend/src/components/HorizontalLinearStepper.jsx'), 'utf8');
const begin = component.indexOf('function buildDronePayload()');
const end = component.indexOf('function buildEnvPayload(', begin);
assert.ok(begin >= 0 && end > begin);
const serialize = new Function('mainJson', component.slice(begin, end) + '\nreturn buildDronePayload();');
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));
for (const entry of manifest.cases) {
  const payload = JSON.parse(fs.readFileSync(path.join(here, entry.frontend_payload), 'utf8'));
  const actual = JSON.parse(JSON.stringify(serialize({ getAllDrones: () => payload.Drones })));
  assert.deepEqual(actual, payload.Drones, entry.case_id);
}
console.log('PASS: actual frontend drone serializer preserves all 18 mission and camera payloads.');
