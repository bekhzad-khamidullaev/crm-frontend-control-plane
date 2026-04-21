import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const modelsDir = path.join(root, 'src/shared/api/generated/models');
const indexFile = path.join(root, 'src/shared/api/generated/index.ts');

const requiredFiles = [
  'AssigneeTypeEnum.ts',
  'BusinessProcessInstanceStatusEnum.ts',
  'BusinessProcessLifecycleStatusEnum.ts',
  'CompanyWrite.ts',
  'ContactWrite.ts',
  'DealWrite.ts',
  'IntegrationProviderEnum.ts',
  'LandingPageStatusEnum.ts',
  'LeadStatusEnum.ts',
  'LeadWrite.ts',
  'MessageTemplateChannelEnum.ts',
  'NotificationPriorityEnum.ts',
  'PatchedCompanyWrite.ts',
  'PatchedContactWrite.ts',
  'PatchedDealWrite.ts',
  'PatchedLeadWrite.ts',
  'PublicFunnelEventTypeEnum.ts',
  'TaskPriorityEnum.ts',
];

const forbiddenHashedEnums = [
  'AssigneeType79fEnum.ts',
  'AssigneeTypeA95Enum.ts',
  'Channel3ffEnum.ts',
  'EventType3eeEnum.ts',
  'PriorityA9bEnum.ts',
  'PriorityB70Enum.ts',
  'Provider968Enum.ts',
  'Status010Enum.ts',
  'Status08fEnum.ts',
  'Status77bEnum.ts',
  'StatusA5eEnum.ts',
];

const files = new Set(fs.readdirSync(modelsDir));
const missing = requiredFiles.filter((file) => !files.has(file));
if (missing.length) {
  console.error(`Missing generated contract files: ${missing.join(', ')}`);
  process.exit(1);
}

const leaked = forbiddenHashedEnums.filter((file) => files.has(file));
if (leaked.length) {
  console.error(`Legacy hashed enum files leaked into generated client: ${leaked.join(', ')}`);
  process.exit(1);
}

const indexContent = fs.readFileSync(indexFile, 'utf8');
const hasLegacyVoipExport =
  indexContent.includes("export { VoipService } from './services/VoipService';") ||
  indexContent.includes("export { VoIpService } from './services/VoIpService';");
const hasVoipAliasPatch = indexContent.includes('VoIpService as VoipService');

if (hasLegacyVoipExport && !hasVoipAliasPatch) {
  console.error('Generated API index lost VoIP alias patch.');
  process.exit(1);
}

console.log('Generated API contract check passed.');
