import { useCallback, useEffect, useState } from "react";
import draftRecoveryService, { type FormDraft } from "../services/draft-recovery";

export interface UseDraftRecoveryOptions {
  formId: string;
  getFormData: () => Record<string, any>;
  autoSaveDebounceMs?: number;
  enableAutoSave?: boolean;
  maxDraftAge?: number;
}

export interface UseDraftRecoveryReturn {
  draft: FormDraft | null;
  showRecoveryPrompt: boolean;
  recoverDraft: () => void;
  discardDraft: () => void;
  saveDraft: () => void;
  clearDraft: () => void;
}

export function useDraftRecovery(
  options: UseDraftRecoveryOptions
): UseDraftRecoveryReturn {
  const {
    formId,
    getFormData,
    autoSaveDebounceMs = 1000,
    enableAutoSave = true,
  } = options;

  const [draft, setDraft] = useState<FormDraft | null>(null);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);

  useEffect(() => {
    const existingDraft = draftRecoveryService.getDraft(formId);
    if (existingDraft) {
      setDraft(existingDraft);
      setShowRecoveryPrompt(true);
    }
  }, [formId]);

  useEffect(() => {
    if (!enableAutoSave) {
      return;
    }

    const cleanup = draftRecoveryService.setupAutoSave(
      formId,
      getFormData,
      autoSaveDebounceMs
    );

    return cleanup;
  }, [formId, getFormData, autoSaveDebounceMs, enableAutoSave]);

  const recoverDraft = useCallback(() => {
    setShowRecoveryPrompt(false);
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
