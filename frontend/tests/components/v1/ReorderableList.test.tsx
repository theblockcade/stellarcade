import { render, screen, fireEvent } from '@testing-library/react';
import { ReorderableList } from '@/components/v1/ReorderableList';
import type { ReorderableListItem } from '@/components/v1/ReorderableList';

interface TestItem extends ReorderableListItem {
  label: string;
}

function makeItems(count: number): TestItem[] {
  return Array.from({ length: count }, (_, i) => ({ id: `item-${i}`, label: `Item ${i + 1}` }));
}

function renderItem(item: TestItem) {
  return <span>{item.label}</span>;
}

describe('ReorderableList', () => {
  // ── Loading state ──────────────────────────────────────────────────────────

  it('renders loading skeletons when isLoading is true', () => {
    render(
      <ReorderableList
        items={[]}
        onReorder={vi.fn()}
        renderItem={renderItem}
        isLoading
        skeletonCount={4}
        testId="rl"
      />,
    );

    const container = screen.getByTestId('rl');
    expect(container).toHaveAttribute('aria-busy', 'true');
    const skeletons = container.querySelectorAll('.rl__skeleton');
    expect(skeletons).toHaveLength(4);
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it('renders the empty message when items array is empty and not loading', () => {
    render(
      <ReorderableList
        items={[]}
        onReorder={vi.fn()}
        renderItem={renderItem}
        emptyMessage="Nothing here yet."
        testId="rl"
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Nothing here yet.');
  });

  // ── Renders items ──────────────────────────────────────────────────────────

  it('renders one list item per entry', () => {
    const items = makeItems(3);
    render(
      <ReorderableList items={items} onReorder={vi.fn()} renderItem={renderItem} testId="rl" />,
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  // ── Drag handles present ───────────────────────────────────────────────────

  it('renders a drag handle button for each item', () => {
    const items = makeItems(3);
    render(
      <ReorderableList items={items} onReorder={vi.fn()} renderItem={renderItem} testId="rl" />,
    );

    const handles = screen.getAllByRole('button');
    // One handle per item
    expect(handles).toHaveLength(3);
  });

  // ── Handle accessible attributes ──────────────────────────────────────────

  it('gives each handle an aria-label describing its position', () => {
    const items = makeItems(2);
    render(
      <ReorderableList items={items} onReorder={vi.fn()} renderItem={renderItem} testId="rl" />,
    );

    const handle0 = screen.getByTestId('rl-handle-0');
    const handle1 = screen.getByTestId('rl-handle-1');

    expect(handle0).toHaveAttribute('aria-label', expect.stringContaining('1 of 2'));
    expect(handle1).toHaveAttribute('aria-label', expect.stringContaining('2 of 2'));
  });

  // ── Disabled state ─────────────────────────────────────────────────────────

  it('disables all handles when disabled prop is true', () => {
    const items = makeItems(2);
    render(
      <ReorderableList
        items={items}
        onReorder={vi.fn()}
        renderItem={renderItem}
        disabled
        testId="rl"
      />,
    );

    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled());
  });

  // ── Keyboard grab ──────────────────────────────────────────────────────────

  it('toggles aria-pressed on Space and announces grab', () => {
    const items = makeItems(3);
    render(
      <ReorderableList items={items} onReorder={vi.fn()} renderItem={renderItem} testId="rl" />,
    );

    const handle0 = screen.getByTestId('rl-handle-0');
    expect(handle0).toHaveAttribute('aria-pressed', 'false');

    fireEvent.keyDown(handle0, { key: ' ' });
    expect(handle0).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(handle0, { key: ' ' });
    expect(handle0).toHaveAttribute('aria-pressed', 'false');
  });

  // ── Keyboard reorder — ArrowDown ───────────────────────────────────────────

  it('calls onReorder with items swapped when ArrowDown is pressed while grabbed', () => {
    const items = makeItems(3);
    const onReorder = vi.fn();
    render(
      <ReorderableList items={items} onReorder={onReorder} renderItem={renderItem} testId="rl" />,
    );

    const handle0 = screen.getByTestId('rl-handle-0');

    // Grab item 0
    fireEvent.keyDown(handle0, { key: ' ' });
    // Move it down
    fireEvent.keyDown(handle0, { key: 'ArrowDown' });

    expect(onReorder).toHaveBeenCalledTimes(1);
    const reordered = onReorder.mock.calls[0][0] as TestItem[];
    expect(reordered[0].id).toBe('item-1');
    expect(reordered[1].id).toBe('item-0');
  });

  // ── Keyboard reorder — ArrowUp ─────────────────────────────────────────────

  it('calls onReorder with items swapped when ArrowUp is pressed while grabbed', () => {
    const items = makeItems(3);
    const onReorder = vi.fn();
    render(
      <ReorderableList items={items} onReorder={onReorder} renderItem={renderItem} testId="rl" />,
    );

    const handle2 = screen.getByTestId('rl-handle-2');

    fireEvent.keyDown(handle2, { key: ' ' });
    fireEvent.keyDown(handle2, { key: 'ArrowUp' });

    expect(onReorder).toHaveBeenCalledTimes(1);
    const reordered = onReorder.mock.calls[0][0] as TestItem[];
    expect(reordered[1].id).toBe('item-2');
    expect(reordered[2].id).toBe('item-1');
  });

  // ── ArrowDown at last position does not call onReorder ─────────────────────

  it('does not call onReorder when trying to move last item further down', () => {
    const items = makeItems(2);
    const onReorder = vi.fn();
    render(
      <ReorderableList items={items} onReorder={onReorder} renderItem={renderItem} testId="rl" />,
    );

    const handle1 = screen.getByTestId('rl-handle-1');
    fireEvent.keyDown(handle1, { key: ' ' });
    fireEvent.keyDown(handle1, { key: 'ArrowDown' });

    expect(onReorder).not.toHaveBeenCalled();
  });

  // ── Escape cancels grab ────────────────────────────────────────────────────

  it('releases the grabbed item without reordering when Escape is pressed', () => {
    const items = makeItems(3);
    const onReorder = vi.fn();
    render(
      <ReorderableList items={items} onReorder={onReorder} renderItem={renderItem} testId="rl" />,
    );

    const handle0 = screen.getByTestId('rl-handle-0');
    fireEvent.keyDown(handle0, { key: ' ' });
    expect(handle0).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(handle0, { key: 'Escape' });
    expect(handle0).toHaveAttribute('aria-pressed', 'false');
    expect(onReorder).not.toHaveBeenCalled();
  });

  // ── Announcement region ────────────────────────────────────────────────────

  it('has a live region for screen-reader announcements', () => {
    const items = makeItems(2);
    render(
      <ReorderableList items={items} onReorder={vi.fn()} renderItem={renderItem} testId="rl" />,
    );

    expect(screen.getByTestId('rl-announcement')).toBeInTheDocument();
  });
});
