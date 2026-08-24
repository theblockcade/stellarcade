# Item Inspection Modal

An interactive modal for inspecting collectible items and NFTs with a 3D parallax tilt effect, holographic overlays, and detailed metadata tabs.

## Features

- **3D Parallax Tilt Effect** - Card tilts smoothly based on mouse position using requestAnimationFrame for optimal performance
- **Holographic Shimmer Overlay** - Animated foil effect based on item rarity tier
- **Rarity-Based Styling** - Distinct colors and effects for Common, Rare, Epic, and Legendary items
- **Metadata Tabs** - Three tabs for different information views:
  - Traits & Stats
  - Lore & Description  
  - On-Chain Proof & Token ID
- **Action Buttons** - Equip as Avatar, Share Badge, View on Stellar Expert
- **Full Accessibility** - ESC key close, focus trapping, keyboard navigation
- **Responsive Design** - Works on desktop and mobile devices

## Installation

```bash
# Copy the component to your project
cp -r experimental/ui/item-inspect-modal /path/to/your/components/
```

## Usage

```tsx
import { ItemInspectModal } from './item-inspect-modal/ItemInspectModal';
import type { CollectibleItem } from './item-inspect-modal/types';

const item: CollectibleItem = {
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

function App() {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleEquip = (itemId: string) => {
    console.log('Equipping item:', itemId);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Inspect Item</button>
      
      <ItemInspectModal
        isOpen={isOpen}
        item={item}
        onClose={() => setIsOpen(false)}
        onEquip={handleEquip}
      />
    </>
  );
}
```

## Props

### ItemInspectModal

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Whether the modal is open |
| `item` | `CollectibleItem` | required | The item to display |
| `onClose` | `() => void` | required | Callback when modal closes |
| `onEquip` | `(id: string) => void` | optional | Callback when equip button is clicked |
| `className` | `string` | `''` | Additional CSS classes |
| `testId` | `string` | `'item-inspect-modal'` | Test ID for testing |

### CollectibleItem

```typescript
interface CollectibleItem {
  id: string;                          // Unique identifier
  name: string;                        // Item name
  rarity: RarityTier;                  // Rarity tier
  imageUrl: string;                    // Image URL
  traits: Trait[];                      // Array of traits
  tokenId?: string;                    // Optional token ID
  description?: string;                // Optional description
  lore?: string;                       // Optional lore text
  contractAddress?: string;            // Optional contract address
}
```

### Trait

```typescript
interface Trait {
  name: string;                        // Trait name
  value: string;                       // Trait value
  type?: string;                       // Optional trait type
}
```

### RarityTier

```typescript
type RarityTier = 'Common' | 'Rare' | 'Epic' | 'Legendary';
```

## Rarity Colors

Each rarity tier has distinct colors that are applied to badges, borders, and glows:

- **Common**: Gray (#9ca3af)
- **Rare**: Blue (#3b82f6)  
- **Epic**: Purple (#8b5cf6)
- **Legendary**: Gold (#f59e0b)

## Accessibility

- **Keyboard Navigation**: Full keyboard support with tab navigation
- **Focus Management**: Focus is trapped when modal opens, restored when closed
- **Screen Reader Support**: Proper ARIA labels and roles
- **Reduced Motion**: Respects prefers-reduced-motion preference
- **ESC Key**: Modal closes when ESC key is pressed
- **Focus Indicators**: Clear focus states for keyboard users

## Performance

- **requestAnimationFrame**: Used for smooth tilt animations without blocking the main thread
- **CSS Transforms**: Hardware-accelerated transforms for smooth 3D effects
- **Optimized Re-renders**: Minimal re-renders with proper React patterns
- **Reduced Motion Support**: Animations disabled for users who prefer reduced motion

## Testing

```bash
# Run tests
npm test ItemInspectModal.test.tsx
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers with touch support
- Requires CSS 3D transforms support

## Customization

You can customize the appearance by:

1. Modifying the `RARITY_COLORS` constant in `ItemInspectModal.tsx`
2. Adjusting CSS variables in `ItemInspectModal.css`
3. Changing the tilt intensity by passing a different value to `TiltCard`
4. Customizing the holographic animation in the CSS

## TiltCard Component

The modal includes a reusable `TiltCard` component that can be used independently:

```tsx
import { TiltCard } from './item-inspect-modal/TiltCard';

<TiltCard intensity={15}>
  <div>Your content here</div>
</TiltCard>
```

### TiltCard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Content to display |
| `className` | `string` | `''` | Additional CSS classes |
| `intensity` | `number` | `15` | Tilt intensity in degrees |
| `testId` | `string` | `'tilt-card'` | Test ID for testing |