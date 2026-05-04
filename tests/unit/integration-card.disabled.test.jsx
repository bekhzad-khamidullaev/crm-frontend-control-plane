import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import IntegrationCard from '../../src/components/IntegrationCard.jsx';

describe('IntegrationCard disabled mode', () => {
  it('shows warning and blocks connect action when disabled', () => {
    const onConnect = vi.fn();

    render(
      <IntegrationCard
        title="WhatsApp"
        description="desc"
        icon={<span>icon</span>}
        type="whatsapp"
        status="disconnected"
        onConnect={onConnect}
        disabled
        disabledReason="License blocked"
      />,
    );

    expect(screen.getByText(/License blocked/i)).toBeInTheDocument();

    const connectBtn = screen.getByRole('button', { name: /подключить|connect/i });
    expect(connectBtn).toBeDisabled();

    fireEvent.click(connectBtn);
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('allows connect action when enabled', async () => {
    const onConnect = vi.fn().mockResolvedValue(undefined);

    render(
      <IntegrationCard
        title="Facebook"
        description="desc"
        icon={<span>icon</span>}
        type="facebook"
        status="disconnected"
        onConnect={onConnect}
      />,
    );

    const connectBtn = screen.getByRole('button', { name: /подключить|connect/i });
    expect(connectBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(connectBtn);
    });
    expect(onConnect).toHaveBeenCalledTimes(1);
  });
});
