import { describe, expect, it } from 'vitest';
import { getDeploymentOptionsForRequest } from '../../src/pages/control-plane-admin/sections/QueueSection.jsx';

describe('QueueSection deployment matching', () => {
  const deployments = [
    {
      id: 11,
      instance_id: 'rebinding-alpha',
      environment: 'prod',
      domain: 'https://wrong-domain.example.com',
    },
    {
      id: 42,
      instance_id: 'rebinding-beta',
      environment: 'stage',
      domain: 'https://www.example.com/rebinding',
    },
  ];

  it.each([
    ['request_payload.domain', { request_payload: { domain: 'https://example.com/path' } }],
    ['request_payload.request_domain', { request_payload: { request_domain: 'example.com' } }],
  ])('matches deployment by %s', (_, row) => {
    const options = getDeploymentOptionsForRequest(
      {
        instance_id: 'no-instance-match',
        ...row,
      },
      deployments,
    );

    expect(options).toEqual([
      {
        label: 'rebinding-beta (stage, https://www.example.com/rebinding)',
        value: 42,
      },
    ]);
  });
});
