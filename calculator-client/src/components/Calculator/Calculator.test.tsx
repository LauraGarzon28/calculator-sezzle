import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalHistoryStorage, type HistoryStorage } from '../../history/historyStorage';
import { createFakeCalculatorApi } from '../../test/fakeCalculatorApi';
import { Calculator } from './Calculator';

describe('Calculator', () => {
  let api: ReturnType<typeof createFakeCalculatorApi>;
  let historyStorage: HistoryStorage;

  beforeEach(() => {
    api = createFakeCalculatorApi();
    historyStorage = createLocalHistoryStorage(window.localStorage);
  });

  const renderCalculator = () => {
    const user = userEvent.setup();
    render(<Calculator api={api} historyStorage={historyStorage} />);
    return user;
  };

  const display = () => screen.getByTestId('display-value');
  const clickKeys = async (user: ReturnType<typeof userEvent.setup>, labels: string[]) => {
    for (const label of labels) {
      await user.click(screen.getByRole('button', { name: label }));
    }
  };

  it('starts at zero with an empty history', () => {
    renderCalculator();

    expect(display()).toHaveTextContent('0');
    expect(screen.getByText("There's no history yet.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear history' })).toBeDisabled();
  });

  it('calculates using the keypad', async () => {
    const user = renderCalculator();

    await clickKeys(user, ['1', '2', 'Add', '3', 'Equals']);

    await waitFor(() => expect(display()).toHaveTextContent('15'));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('12 + 3 =');
    expect(api.calculate).toHaveBeenCalledWith('add', [12, 3]);
  });

  it('calculates using the keyboard', async () => {
    const user = renderCalculator();

    await user.keyboard('9*4-6{Enter}');

    await waitFor(() => expect(display()).toHaveTextContent('30'));
  });

  it('shows the intermediate result when chaining operators', async () => {
    const user = renderCalculator();

    await user.keyboard('2+2+');

    await waitFor(() => expect(display()).toHaveTextContent('4'));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('4 +');
  });

  it('records calculations in a persisted history and recalls them', async () => {
    const user = renderCalculator();

    await user.keyboard('6*7{Enter}');
    const history = screen.getByRole('list');
    await waitFor(() => expect(within(history).getByText('6 × 7 =')).toBeInTheDocument());
    expect(historyStorage.load()).toHaveLength(1);

    await user.keyboard('{Escape}1+');
    await user.click(within(history).getByRole('button', { name: /6 × 7 =/ }));
    await user.keyboard('{Enter}');

    await waitFor(() => expect(display()).toHaveTextContent('43'));
  });

  it('restores the history saved in a previous session', () => {
    historyStorage.save([{ id: '1', expression: '1 + 1 =', result: '2', createdAt: 1 }]);

    renderCalculator();

    expect(screen.getByText('1 + 1 =')).toBeInTheDocument();
  });

  it('clears the history', async () => {
    const user = renderCalculator();
    await user.keyboard('1+1{Enter}');
    await screen.findByRole('list');

    await user.click(screen.getByRole('button', { name: 'Clear history' }));

    expect(screen.getByText("There's no history yet.")).toBeInTheDocument();
    await waitFor(() => expect(historyStorage.load()).toEqual([]));
  });

  it('shows errors and disables operators until a new entry starts', async () => {
    const user = renderCalculator();

    await user.keyboard('8/0{Enter}');

    await waitFor(() => expect(display()).toHaveTextContent('Cannot divide by zero'));
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled();

    await clickKeys(user, ['Clear']);

    await waitFor(() => expect(display()).toHaveTextContent('0'));
    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
  });

  it('supports the advanced operations from the keypad', async () => {
    const user = renderCalculator();

    await clickKeys(user, ['1', '6', 'Square root']);
    await waitFor(() => expect(display()).toHaveTextContent('4'));

    await clickKeys(user, ['Power', '3', 'Equals']);
    await waitFor(() => expect(display()).toHaveTextContent('64'));

    await clickKeys(user, ['Negate', 'Backspace', 'Clear entry', '5', 'Decimal point', '5', 'Percent']);
    await waitFor(() => expect(display()).toHaveTextContent('0.055'));
  });
});
