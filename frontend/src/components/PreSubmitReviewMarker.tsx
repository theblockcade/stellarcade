import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';

export interface ReviewMarker {
  id: string;
  type: 'warning' | 'info' | 'critical' | 'success';
  title: string;
  description: string;
  checked: boolean;
  required: boolean;
}

export interface PreSubmitReviewMarkerProps {
  markers: ReviewMarker[];
  onMarkersChange: (markers: ReviewMarker[]) => void;
  onReviewComplete: (allRequired: boolean) => void;
  isHighImpact?: boolean;
  contractType?: string;
  className?: string;
}

const PreSubmitReviewMarker: React.FC<PreSubmitReviewMarkerProps> = ({
  markers,
  onMarkersChange,
  onReviewComplete,
  isHighImpact = false,
  contractType = 'contract',
  className = '',
}) => {
  const [expandedMarkers, setExpandedMarkers] = useState<Set<string>>(new Set());
  const [reviewStartTime] = useState<number>(Date.now());

  const toggleMarker = (markerId: string) => {
    const updatedMarkers = markers.map(marker =>
      marker.id === markerId
        ? { ...marker, checked: !marker.checked }
        : marker
    );
    onMarkersChange(updatedMarkers);
  };

  const toggleExpanded = (markerId: string) => {
    const newExpanded = new Set(expandedMarkers);
    if (newExpanded.has(markerId)) {
      newExpanded.delete(markerId);
    } else {
      newExpanded.add(markerId);
    }
    setExpandedMarkers(newExpanded);
  };

  const getMarkerIcon = (type: ReviewMarker['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMarkerBorderColor = (type: ReviewMarker['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const requiredMarkers = markers.filter(m => m.required);
  const allRequiredChecked = requiredMarkers.every(m => m.checked);
  const checkedCount = markers.filter(m => m.checked).length;
  const totalCount = markers.length;
  const completionPercentage = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  useEffect(() => {
    onReviewComplete(allRequiredChecked);
  }, [allRequiredChecked, onReviewComplete]);

  if (markers.length === 0) {
    return null;
  }

  return (
    <div className={`pre-submit-review-marker ${className}`}>
      {/* Header */}
      <div className={`p-4 rounded-t-lg border-b ${isHighImpact ? 'bg-red-100 border-red-200' : 'bg-blue-100 border-blue-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isHighImpact ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <Shield className="w-6 h-6 text-blue-600" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Pre-Submit Review {isHighImpact && '(High Impact)'}
              </h3>
              <p className="text-sm text-gray-600">
                Review these items before submitting your {contractType} form
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {checkedCount} of {totalCount} completed
            </div>
            <div className="text-xs text-gray-500">
              {requiredMarkers.length} required items
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Review Items */}
      <div className="border border-t-0 rounded-b-lg">
        {markers.map((marker, index) => (
          <div
            key={marker.id}
            className={`border-b last:border-b-0 ${getMarkerBorderColor(marker.type)}`}
          >
            <div className="p-4">
              <div className="flex items-start space-x-3">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id={`marker-${marker.id}`}
                    checked={marker.checked}
                    onChange={() => toggleMarker(marker.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getMarkerIcon(marker.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <label
                        htmlFor={`marker-${marker.id}`}
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {marker.title}
                      </label>
                      {marker.required && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleExpanded(marker.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={expandedMarkers.has(marker.id) ? 'Collapse' : 'Expand'}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedMarkers.has(marker.id) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded Description */}
                  {expandedMarkers.has(marker.id) && (
                    <div className="mt-2 text-sm text-gray-600">
                      {marker.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            {allRequiredChecked ? (
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                All required items completed
              </span>
            ) : (
              <span className="flex items-center text-yellow-600">
                <Clock className="w-4 h-4 mr-1" />
                {requiredMarkers.length - requiredMarkers.filter(m => m.checked).length} required items remaining
              </span>
            )}
          </div>
          <div className="text-gray-500">
            Review time: {Math.round((Date.now() - reviewStartTime) / 1000)}s
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreSubmitReviewMarker;