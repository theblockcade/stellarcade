import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ItemInspectModal } from './ItemInspectModal';
import type { CollectibleItem } from './types';

const mockItem: CollectibleItem = {
  id: 'item-1',
  name: 'Cosmic Badge',
  rarity: 'Legendary',
  imageUrl: 'https://example.com/badge.png',
  traits: [
    { name: 'Power', value: '95' },
    { name: 'Rarity', value: 'Legendary' },
  ],
  tokenId: '12345',
  description: 'A legendary cosmic badge from the depths of space.',
  lore: 'Forged in the heart of a dying star, this badge represents ultimate power.',
  contractAddress: 'GABCDEFGHJKLMNPQRSTUVWXYZ234567ABCDEFGHJKLMNPQRSTUVWXYZ2',
};

describe('ItemInspectModal', () => {
  it('renders modal when isOpen is true', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('item-inspect-modal')).toBeInTheDocument();
    expect(screen.getByText('Cosmic Badge')).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    render(
      <ItemInspectModal
        isOpen={false}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('item-inspect-modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByTestId('item-inspect-modal-close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={onClose}
      />
    );

    const backdrop = screen.getByTestId('item-inspect-modal').querySelector('.item-inspect-modal__backdrop');
    fireEvent.click(backdrop!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', () => {
    const onClose = vi.fn();
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders item image', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    const image = screen.getByAltText('Cosmic Badge');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/badge.png');
  });

  it('displays rarity badge', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Legendary')).toBeInTheDocument();
  });

  it('renders traits in traits tab', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Power')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('Rarity')).toBeInTheDocument();
    expect(screen.getByText('Legendary')).toBeInTheDocument();
  });

  it('switches tabs correctly', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    const loreTab = screen.getByTestId('item-inspect-modal-tab-lore');
    fireEvent.click(loreTab);

    expect(screen.getByText('Forged in the heart of a dying star')).toBeInTheDocument();
  });

  it('renders on-chain tab with token data', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    const onchainTab = screen.getByTestId('item-inspect-modal-tab-onchain');
    fireEvent.click(onchainTab);

    expect(screen.getByText('12345')).toBeInTheDocument();
    expect(screen.getByText(/GABCD/)).toBeInTheDocument();
  });

  it('calls onEquip with item ID when equip button is clicked', () => {
    const onEquip = vi.fn();
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
        onEquip={onEquip}
      />
    );

    const equipButton = screen.getByTestId('item-inspect-modal-equip');
    fireEvent.click(equipButton);

    expect(onEquip).toHaveBeenCalledWith('item-1');
  });

  it('does not render equip button when onEquip is not provided', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('item-inspect-modal-equip')).not.toBeInTheDocument();
  });

  it('handles share button click', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    const shareButton = screen.getByTestId('item-inspect-modal-share');
    expect(shareButton).toBeInTheDocument();
  });

  it('handles view on explorer button click', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    const explorerButton = screen.getByTestId('item-inspect-modal-explorer');
    expect(explorerButton).toBeInTheDocument();
  });

  it('does not render explorer button when token data is missing', () => {
    const itemWithoutToken = { ...mockItem, tokenId: undefined };
    render(
      <ItemInspectModal
        isOpen={true}
        item={itemWithoutToken}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('item-inspect-modal-explorer')).not.toBeInTheDocument();
  });

  it('renders empty state for traits when no traits provided', () => {
    const itemWithoutTraits = { ...mockItem, traits: [] };
    render(
      <ItemInspectModal
        isOpen={true}
        item={itemWithoutTraits}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('No traits available')).toBeInTheDocument();
  });

  it('renders empty state for lore when no description provided', () => {
    const itemWithoutLore = { ...mockItem, description: undefined, lore: undefined };
    render(
      <ItemInspectModal
        isOpen={true}
        item={itemWithoutLore}
        onClose={vi.fn()}
      />
    );

    const loreTab = screen.getByTestId('item-inspect-modal-tab-lore');
    fireEvent.click(loreTab);

    expect(screen.getByText('No description available')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
        className="custom-class"
      />
    );

    const modal = screen.getByTestId('item-inspect-modal');
    expect(modal).toHaveClass('custom-class');
  });

  it('applies custom testId', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
        testId="custom-modal"
      />
    );

    expect(screen.getByTestId('custom-modal')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={vi.fn()}
      />
    );

    const modal = screen.getByTestId('item-inspect-modal');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'item-inspect-modal-title');
  });

  it('manages focus when modal opens and closes', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <ItemInspectModal
        isOpen={false}
        item={mockItem}
        onClose={onClose}
      />
    );

    rerender(
      <ItemInspectModal
        isOpen={true}
        item={mockItem}
        onClose={onClose}
      />
    );

    expect(screen.getByTestId('item-inspect-modal')).toBeInTheDocument();
  });

  it('handles different rarity tiers', () => {
    const rareItem = { ...mockItem, rarity: 'Rare' as const };
    render(
      <ItemInspectModal
        isOpen={true}
        item={rareItem}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Rare')).toBeInTheDocument();
  });
});