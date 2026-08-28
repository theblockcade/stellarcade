# Session Recovery Prompt

Experimental UI component for handling wallet reconnection and session recovery prompts.

## Usage

```tsx
import { SessionRecoveryPrompt } from './SessionRecoveryPrompt';

<SessionRecoveryPrompt
  status="disconnected" // 'disconnected' | 'wrong_network' | 'expired'
  expectedNetwork="testnet"
  onReconnect={async () => await reconnectWallet()}
  onDismiss={() => snoozePrompt()}
/>
```
