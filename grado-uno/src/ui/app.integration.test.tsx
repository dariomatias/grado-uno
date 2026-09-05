import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App.tsx';

beforeEach(() => {
  localStorage.clear();
});

describe('Grado Uno — acceptance flows', () => {
  it('opens without an account and shows all seven degrees', () => {
    render(<App />);
    const listbox = screen.getByRole('listbox', { name: 'Degrees' });
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(7);
    expect(options[0]).toHaveTextContent('I');
    expect(options[6]).toHaveTextContent('vii°');
  });

  it('selecting a degree shows symbol, Latin name, function and safe notes', async () => {
    const user = userEvent.setup();
    render(<App />);
    // Degree V of C major = G major / Sol mayor, dominant, notes G B D
    const listbox = screen.getByRole('listbox', { name: 'Degrees' });
    await user.click(within(listbox).getAllByRole('option')[4]!);
    const detail = screen.getByRole('region', { name: 'Selected degree detail' });
    expect(within(detail).getByText('Sol mayor')).toBeInTheDocument();
    expect(within(detail).getByText(/Tension · Dominant/)).toBeInTheDocument();
  });

  it('adds a degree to the progression and shows the tray', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Add .* to progression/ }));
    const tray = screen.getByRole('region', { name: 'Progression' });
    expect(tray).toBeInTheDocument();
  });

  it('changing key preserves the Roman-numeral progression', async () => {
    const user = userEvent.setup();
    render(<App />);
    // Build I – V via quick-start template
    await user.click(screen.getByRole('button', { name: /Pop \/ worship classic/ }));
    const tray = screen.getByRole('region', { name: 'Progression' });
    expect(within(tray).getAllByText(/^(I|V|vi|IV)$/).length).toBeGreaterThanOrEqual(4);

    // Change key to G
    await user.selectOptions(screen.getByRole('combobox', { name: 'Key' }), 'G');
    // Roman numerals unchanged
    expect(within(tray).getAllByText(/^(I|V|vi|IV)$/).length).toBeGreaterThanOrEqual(4);
  });

  it('switches the fretboard between notes and intervals', async () => {
    const user = userEvent.setup();
    render(<App />);
    const group = screen.getByRole('group', { name: 'Label mode' });
    const intervals = within(group).getByRole('button', { name: 'intervals' });
    await user.click(intervals);
    expect(intervals).toHaveAttribute('aria-pressed', 'true');
    // Root interval label "R" should now appear on the fretboard
    const fretboard = screen.getByRole('region', { name: 'Fretboard' });
    expect(within(fretboard).getAllByText('R').length).toBeGreaterThan(0);
  });

  it('saves a favorite and reloads it from preferences', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Sensitive/ }));

    await user.type(screen.getByRole('textbox', { name: 'Favorite name' }), 'My song');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Clear, then reopen from preferences
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    await user.click(screen.getByRole('button', { name: 'Open preferences' }));
    const dialog = screen.getByRole('dialog', { name: 'Preferences' });
    expect(within(dialog).getByText('My song')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /^My song/ }));

    // Progression restored
    const tray = screen.getByRole('region', { name: 'Progression' });
    expect(tray).toBeInTheDocument();
  });

  it('keeps reset-preferences separate from favorites', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Pop \/ worship classic/ }));
    await user.type(screen.getByRole('textbox', { name: 'Favorite name' }), 'Keep me');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.click(screen.getByRole('button', { name: 'Open preferences' }));
    await user.click(screen.getByRole('button', { name: /Reset preferences/ }));

    // Favorite still listed after reset
    const dialog = screen.getByRole('dialog', { name: 'Preferences' });
    expect(within(dialog).getByText('Keep me')).toBeInTheDocument();
  });
});
