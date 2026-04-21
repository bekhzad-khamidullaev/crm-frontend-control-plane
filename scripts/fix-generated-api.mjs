import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const generatedIndexPath = path.join(projectRoot, 'src/shared/api/generated/index.ts');

const original = fs.readFileSync(generatedIndexPath, 'utf8');

const normalized = original
  .replace(
    "export { VoipService } from './services/VoipService';",
    "export { VoIpService as VoipService } from './services/VoipService';"
  )
  .replace("export { VoIpService } from './services/VoIpService';\n", '');

if (normalized !== original) {
  fs.writeFileSync(generatedIndexPath, normalized);
  process.stdout.write('Patched generated API index for VoIP service naming.\n');
}
