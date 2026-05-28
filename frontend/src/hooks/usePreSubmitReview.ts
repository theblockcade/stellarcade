import { useState, useCallback, useMemo } from 'react';
import { ReviewMarker } from '../components/PreSubmitReviewMarker';

export interface UsePreSubmitReviewOptions {
  contractType?: string;
  isHighImpact?: boolean;
  customMarkers?: ReviewMarker[];
}

export interface UsePreSubmitReviewReturn {
  markers: ReviewMarker[];
  updateMarker: (markerId: string, checked: boolean) => void;
  updateMarkers: (markers: ReviewMarker[]) => void;
  resetMarkers: () => void;
  allRequiredCompleted: boolean;
  completionPercentage: number;
  isReviewComplete: boolean;
  getMarkersByType: (type: ReviewMarker['type']) => ReviewMarker[];
}

const DEFAULT_HIGH_IMPACT_MARKERS: ReviewMarker[] = [
  {
    id: 'security-audit',
    type: 'critical',
    title: 'Security Audit Completed',
    description: 'Verify that a comprehensive security audit has been performed on this contract, including vulnerability assessments and code review.',
    checked: false,
    required: true,
  },
  {
    id: 'fund-limits',
    type: 'critical',
    title: 'Fund Limits Verified',
    description: 'Confirm that appropriate fund limits and safeguards are in place to prevent excessive losses or unauthorized transfers.',
    checked: false,
    required: true,
  },
  {
    id: 'admin-controls',
    type: 'warning',
    title: 'Admin Controls Reviewed',
    description: 'Review all administrative functions and ensure proper access controls and multi-signature requirements are implemented.',
    checked: false,
    required: true,
  },
  {
    id: 'emergency-procedures',
    type: 'warning',
    title: 'Emergency Procedures Documented',
    description: 'Verify that emergency pause mechanisms and recovery procedures are properly documented and tested.',
    checked: false,
    required: true,
  },
  {
    id: 'testing-coverage',
    type: 'info',
    title: 'Testing Coverage Adequate',
    description: 'Ensure comprehensive test coverage including unit tests, integration tests, and edge case scenarios.',
    checked: false,
    required: false,
  },
  {
    id: 'documentation-complete',
    type: 'info',
    title: 'Documentation Complete',
    description: 'Verify that all contract functions, parameters, and usage instructions are properly documented.',
    checked: false,
    required: false,
  },
];

const DEFAULT_STANDARD_MARKERS: ReviewMarker[] = [
  {
    id: 'parameters-validated',
    type: 'warning',
    title: 'Parameters Validated',
    description: 'All input parameters have been validated for correctness and security.',
    checked: false,
    required: true,
  },
  {
    id: 'gas-optimization',
    type: 'info',
    title: 'Gas Optimization Reviewed',
    description: 'Contract has been reviewed for gas efficiency and optimization opportunities.',
    checked: false,
    required: false,
  },
  {
    id: 'error-handling',
    type: 'warning',
    title: 'Error Handling Implemented',
    description: 'Proper error handling and recovery mechanisms are in place.',
    checked: false,
    required: true,
  },
  {
    id: 'upgrade-path',
    type: 'info',
    title: 'Upgrade Path Considered',
    description: 'Future upgrade requirements and migration paths have been considered.',
    checked: false,
    required: false,
  },
];

export const usePreSubmitReview = (options: UsePreSubmitReviewOptions = {}): UsePreSubmitReviewReturn => {
  const { contractType = 'contract', isHighImpact = false, customMarkers } = options;

  const initialMarkers = useMemo(() => {
    if (customMarkers) {
      return customMarkers;
    }
    return isHighImpact ? DEFAULT_HIGH_IMPACT_MARKERS : DEFAULT_STANDARD_MARKERS;
  }, [customMarkers, isHighImpact]);

  const [markers, setMarkers] = useState<ReviewMarker[]>(initialMarkers);

  const updateMarker = useCallback((markerId: string, checked: boolean) => {
    setMarkers(prev => 
      prev.map(marker => 
        marker.id === markerId ? { ...marker, checked } : marker
      )
    );
  }, []);

  const updateMarkers = useCallback((newMarkers: ReviewMarker[]) => {
    setMarkers(newMarkers);
  }, []);

  const resetMarkers = useCallback(() => {
    setMarkers(initialMarkers.map(marker => ({ ...marker, checked: false })));
  }, [initialMarkers]);

  const getMarkersByType = useCallback((type: ReviewMarker['type']) => {
    return markers.filter(marker => marker.type === type);
  }, [markers]);

  const allRequiredCompleted = useMemo(() => {
    const requiredMarkers = markers.filter(marker => marker.required);
    return requiredMarkers.length > 0 && requiredMarkers.every(marker => marker.checked);
  }, [markers]);

  const completionPercentage = useMemo(() => {
    if (markers.length === 0) return 0;
    const checkedCount = markers.filter(marker => marker.checked).length;
    return (checkedCount / markers.length) * 100;
  }, [markers]);

  const isReviewComplete = useMemo(() => {
    return markers.every(marker => marker.checked);
  }, [markers]);

  return {
    markers,
    updateMarker,
    updateMarkers,
    resetMarkers,
    allRequiredCompleted,
    completionPercentage,
    isReviewComplete,
    getMarkersByType,
  };
};

export default usePreSubmitReview;