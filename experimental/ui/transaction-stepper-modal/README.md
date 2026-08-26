# TransactionStepperModal

A step-by-step guidance modal for multi-stage transaction workflows on Stellar.

## Features
- Progress bar displaying step status (Pending, Active, Complete, Failed)
- Active step signature spinner
- Detailed step description and step counter
- Failed step error alert with retry button
- Direct transaction links to Stellar Expert on completion

## Usage
```tsx
import { TransactionStepperModal } from './TransactionStepperModal';

<TransactionStepperModal
  isOpen={isOpen}
  steps={steps}
  currentStepIndex={currentStepIndex}
  onRetry={handleRetry}
  onCancel={handleCancel}
/>
```
