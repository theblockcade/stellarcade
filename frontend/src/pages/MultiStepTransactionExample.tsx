import React, { useState } from 'react';
import { GuidedActionFooter } from '../components/v1/GuidedActionFooter';

interface TransactionFormData {
  amount: string;
  recipient: string;
  memo: string;
}

type TransactionStep = 'review' | 'confirm' | 'submit';

const MultiStepTransactionExample: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<TransactionStep>('review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    recipient: '',
    memo: '',
  });

  const steps = [
    { id: 'review', label: 'Review Details' },
    { id: 'confirm', label: 'Confirm Transaction' },
    { id: 'submit', label: 'Submit' },
  ];

  const handleNext = () => {
    if (currentStep === 'review') {
      setCurrentStep('confirm');
    } else if (currentStep === 'confirm') {
      setCurrentStep('submit');
    }
  };

  const handleBack = () => {
    if (currentStep === 'confirm') {
      setCurrentStep('review');
    } else if (currentStep === 'submit') {
      setCurrentStep('confirm');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate transaction submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    alert('Transaction submitted successfully!');
  };

  const handleCancel = () => {
    setFormData({ amount: '', recipient: '', memo: '' });
    setCurrentStep('review');
  };

  const canProceed = () => {
    if (currentStep === 'review') {
      return formData.amount && formData.recipient;
    }
    return true;
  };

  const getPrimaryAction = () => {
    if (currentStep === 'submit') {
      return {
        label: isSubmitting ? 'Submitting...' : 'Submit Transaction',
        onClick: handleSubmit,
        isLoading: isSubmitting,
        disabled: isSubmitting,
      };
    }
    return {
      label: 'Continue',
      onClick: handleNext,
      disabled: !canProceed(),
    };
  };

  const getSecondaryAction = () => {
    if (currentStep === 'review') {
      return undefined;
    }
    return {
      label: 'Back',
      onClick: handleBack,
    };
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'review':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Review Transaction Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (XLM)</label>
                <input
                  type="text"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter recipient address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Memo (Optional)</label>
                <input
                  type="text"
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter memo"
                />
              </div>
            </div>
          </div>
        );
      case 'confirm':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Confirm Transaction</h2>
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{formData.amount} XLM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient:</span>
                <span className="font-medium">{formData.recipient}</span>
              </div>
              {formData.memo && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Memo:</span>
                  <span className="font-medium">{formData.memo}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Please review the transaction details above before submitting.
            </p>
          </div>
        );
      case 'submit':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Submit Transaction</h2>
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <p className="text-blue-800">
                You are about to submit a transaction of {formData.amount} XLM to {formData.recipient}.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                This action cannot be undone.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-24">
          {renderStepContent()}
        </div>
        
        <GuidedActionFooter
          primaryAction={getPrimaryAction()}
          secondaryAction={getSecondaryAction()}
          tertiaryAction={{
            label: 'Cancel',
            onClick: handleCancel,
          }}
          steps={steps}
          currentStepId={currentStep}
        />
      </div>
    </div>
  );
};

export default MultiStepTransactionExample;
