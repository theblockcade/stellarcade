# GlobalChatWidget

A collapsible, real-time arcade global chat widget with emoji picker dropdown and user tip shortcuts.

## Features
- Collapsible chat drawer positioned at bottom-right
- Auto-scrolling chat history with user level badges
- System announcement banners
- Built-in emoji picker dropdown
- Tip player shortcut trigger
- Anti-spam rate limiting & character count validation

## Usage
```tsx
import { GlobalChatWidget } from './GlobalChatWidget';

<GlobalChatWidget
  messages={chatMessages}
  currentUser={currentUser}
  onSendMessage={handleSendMessage}
  onTipUser={handleTipUser}
/>
```
