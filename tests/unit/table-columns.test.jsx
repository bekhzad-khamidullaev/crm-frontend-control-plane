import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createAmountColumn } from '../../src/lib/utils/table-columns.jsx';

describe('createAmountColumn', () => {
  it('formats amount using record currency code when it is present', () => {
    const column = createAmountColumn();
    render(column.render(1500, { currency_code: 'USD' }));
    expect(screen.getByText(/\$/)).toBeInTheDocument();
  });

  it('falls back to the default app currency when record currency is missing', () => {
    const column = createAmountColumn();
    render(column.render(1500, {}));
    expect(screen.getByText(/₽/)).toBeInTheDocument();
  });
});
