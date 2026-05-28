/**
 * useDraftRecovery — Hook for managing form draft recovery.
 *
 * Handles draft detection, auto-save setup, and recovery state management.
 */

import { useCallback, useEffect, useState } from 'react';
import draftRecoveryService, { type FormDraft } from '../../services/draft-recovery';

export interface UseDraftRecoveryOptions {
    /** Form identifier for draft lookup */
    formId: string;
    /** Callback to get current form data for auto-save */
    getFormData: () => Record<string, any>;
    /** Auto-save debounce interval in milliseconds (default: 1000) */
    autoSaveDebounceMs?: number;
    /** Whether to enable auto-save (default: true) */
    enableAutoSave?: boolean;
    /** Maximum draft age in milliseconds (default: 24 hours) */
    maxDraftAge?: number;
}

export interface UseDraftRecoveryReturn {
    /** Detected draft, if any */
    draft: FormDraft | null;
    /** Whether a draft recovery prompt should be shown */
    showRecoveryPrompt: boolean;
    /** Recover the draft (populate form with saved data) */
    recoverDraft: () => void;
    /** Discard the draft */
    discardDraft: () => void;
    /** Manually save the current form state */
    saveDraft: () => void;
    /** Clear the draft after successful submission */
    clearDraft: () => void;
}

export function useDraftRecovery(
    options: UseDraftRecoveryOptions,
): UseDraftRecoveryReturn {
    const {
        formId,
        getFormData,
        autoSaveDebounceMs = 1000,
        enableAutoSave = true,
        maxDraftAge,
    } = options;

    const [draft, setDraft] = useState<FormDraft | null>(null);
    const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);

    // Initialize draft recovery service with options
    useEffect(() => {
        // Note: Service is singleton, maxDraftAge would need to be set at initialization
        // For now, we rely on the default 24-hour expiry
    }, [maxDraftAge]);

    // Check for existing draft on mount
    useEffect(() => {
        const existingDraft = draftRecoveryService.getDraft(formId);
        if (existingDraft) {
            setDraft(existingDraft);
            setShowRecoveryPrompt(true);
        }
    }, [formId]);

    // Set up auto-save
    useEffect(() => {
        if (!enableAutoSave) {
            return;
        }

        const cleanup = draftRecoveryService.setupAutoSave(
            formId,
            getFormData,
            autoSaveDebounceMs,
        );

        return cleanup;
    }, [formId, getFormData, autoSaveDebounceMs, enableAutoSave]);

    const recoverDraft = useCallback(() => {
        setShowRecoveryPrompt(false);
        // Draft data is returned via the draft state for the component to handle
    }, []);

    const discardDraft = useCallback(() => {
        draftRecoveryService.clearDraft(formId);
        setDraft(null);
        setShowRecoveryPrompt(false);
    }, [formId]);

    const saveDraft = useCallback(() => {
        const data = getFormData();
        draftRecoveryService.saveDraft(formId, data);
    }, [formId, getFormData]);

    const clearDraft = useCallback(() => {
        draftRecoveryService.clearDraft(formId);
        setDraft(null);
        setShowRecoveryPrompt(false);
    }, [formId]);

    return {
        draft,
        showRecoveryPrompt,
        recoverDraft,
        discardDraft,
        saveDraft,
        clearDraft,
    };
}

export default useDraftRecovery;
