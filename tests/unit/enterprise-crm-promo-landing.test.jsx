import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EnterpriseCrmPromoLanding } from '../../src/components/business/EnterpriseCrmPromoLanding';

describe('EnterpriseCrmPromoLanding', () => {
  it('renders enterprise promo headline and FAQ block', async () => {
    render(<EnterpriseCrmPromoLanding />);

    expect(
      screen.getByText(/Управляйте полным клиентским циклом в E-CRM/i),
    ).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Запросить демо и персональный план внедрения')).toBeInTheDocument();
  });

  it('submits lead form when required fields are filled', async () => {
    const onRequestDemo = vi.fn().mockResolvedValue(undefined);
    render(<EnterpriseCrmPromoLanding onRequestDemo={onRequestDemo} />);

    fireEvent.change(screen.getByLabelText('Имя и фамилия'), {
      target: { value: 'Иван Иванов' },
    });
    fireEvent.change(screen.getByLabelText('Рабочий email'), {
      target: { value: 'ivan@company.com' },
    });
    fireEvent.change(screen.getByLabelText('Компания'), {
      target: { value: 'Компания Тест' },
    });

    const teamSizeSelect = screen.getByLabelText('Размер команды');
    fireEvent.mouseDown(teamSizeSelect);
    fireEvent.click(await screen.findByText('100-300 сотрудников'));

    fireEvent.click(screen.getByText('Согласен на обработку персональных данных.'));
    fireEvent.click(screen.getByRole('button', { name: 'Получить демо-сессию' }));

    await waitFor(() => {
      expect(onRequestDemo).toHaveBeenCalledTimes(1);
    });
  });
});

