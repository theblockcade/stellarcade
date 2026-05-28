import React, { useState, useCallback } from 'react';
import PreSubmitReviewMarker, { ReviewMarker } from './PreSubmitReviewMarker';
import { usePreSubmitReview } from '../hooks/usePreSubmitReview';

export interface ContractFormWrapperProps {
  children: React.ReactNode;
  contractType: string;
  isHighImpact?: boolean;
  customReviewMarkers?: ReviewMarker[];
  onSubmit: (data: any) => Promise<void> | void;
  submitButtonText?: string;
  className?: string;
  disabled?: boolean;
}

const ContractFormWrapper: React.FC<ContractFormWrapperProps> = ({
  children,
  contractType,
  isHighImpact = false,
  customReviewMarkers,
  onSubmit,
  submitButtonText = 'Submit Contract',
  className = '',
  disabled = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const {
    markers,
    updateMarkers,
    allRequiredCompleted,
    completionPercentage,
    isReviewComplete,
  } = usePreSubmitReview({
    contractType,
    isHighImpact,
    customMarkers: customReviewMarkers,
  });

  const handleFormSubmit = useCallback(async (data: any) => {
    if (isHighImpact || markers.length > 0) {
      setFormData(data);
      setShowReview(true);
      return;
    }

    // Direct submit for non-high-impact forms without review markers
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }, [isHighImpact, markers.length, onSubmit]);

  const handleReviewComplete = useCallback((allRequired: boolean) => {
    // This callback is called when review status changes
    // Can be used for additional validation or UI updates
  }, []);

  const handleFinalSubmit = useCallback(async () => {
    if (!allRequiredCompleted) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setShowReview(false);
      setFormData(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [allRequiredCompleted, formData, onSubmit]);

  const handleCancelReview = useCallback(() => {
    setShowReview(false);
    setFormData(null);
  }, []);

  if (showReview) {
    return (
      <div className={`contract-form-wrapper ${className}`}>
        <div className="max-w-4xl mx-auto p-6">
          {/* Review Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Contract Submission Review
            </h2>
            <p className="text-gray-600">
              Please review and confirm all items before submitting your {contractType}.
            </p>
          </div>

          {/* Review Markers */}
          <div className="mb-6">
            <PreSubmitReviewMarker
              markers={markers}
              onMarkersChange={updateMarkers}
              onReviewComplete={handleReviewComplete}
              isHighImpact={isHighImpact}
              contractType={contractType}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancelReview}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Back to Form
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {Math.round(completionPercentage)}% complete
              </div>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={!allRequiredCompleted || isSubmitting}
                className={`px-6 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  allRequiredCompleted && !isSubmitting
                    ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Submitting...' : submitButtonText}
              </button>
            </div>
          </div>

          {/* Warning for incomplete review */}
          {!allRequiredCompleted && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Please complete all required review items before submitting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`contract-form-wrapper ${className}`}>
      {React.cloneElement(children as React.ReactElement, {
        onSubmit: handleFormSubmit,
        disabled: disabled || isSubmitting,
        isSubmitting,
      })}
    </div>
  );
};

export default ContractFormWrapper;