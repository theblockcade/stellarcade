/**
 * Draft Recovery Service — Manages unsaved form drafts with localStorage persistence.
 *
 * Provides automatic draft saving, recovery, and cleanup for long-running forms.
 * Drafts are scoped by form ID and include timestamp metadata for recovery prompts.
 */

export interface FormDraft {
    formId: string;
    data: Record<string, any>;
    savedAt: number;
    expiresAt?: number;
}

export interface DraftRecoveryOptions {
    /** Maximum age of draft in milliseconds before auto-expiry (default: 24 hours) */
    maxAge?: number;
    /** Whether to auto-save drafts on every change (default: true) */
    autoSave?: boolean;
}

const STORAGE_KEY_PREFIX = 'stc_form_draft_v1_';
const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export class DraftRecoveryService {
    private static instance: DraftRecoveryService;
    private maxAge: number;
    private autoSaveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    private constructor(opts?: DraftRecoveryOptions) {
        this.maxAge = opts?.maxAge ?? DEFAULT_MAX_AGE;
    }

    static getInstance(opts?: DraftRecoveryOptions): DraftRecoveryService {
        if (!DraftRecoveryService.instance) {
            DraftRecoveryService.instance = new DraftRecoveryService(opts);
        }
        return DraftRecoveryService.instance;
    }

    /**
     * Save a form draft to localStorage with timestamp.
     */
    saveDraft(formId: string, data: Record<string, any>): void {
        const draft: FormDraft = {
            formId,
            data,
            savedAt: Date.now(),
            expiresAt: Date.now() + this.maxAge,
        };

        try {
            const key = this.getStorageKey(formId);
            localStorage.setItem(key, JSON.stringify(draft));
        } catch (e) {
            console.warn(`Failed to save draft for form ${formId}:`, e);
        }
    }

    /**
     * Retrieve a saved draft if it exists and hasn't expired.
     */
    getDraft(formId: string): FormDraft | null {
        try {
            const key = this.getStorageKey(formId);
            const stored = localStorage.getItem(key);

            if (!stored) {
                return null;
            }

            const draft: FormDraft = JSON.parse(stored);

            // Check expiration
            if (draft.expiresAt && draft.expiresAt < Date.now()) {
                this.clearDraft(formId);
                return null;
            }

            return draft;
        } catch (e) {
            console.warn(`Failed to retrieve draft for form ${formId}:`, e);
            return null;
        }
    }

    /**
     * Check if a draft exists for the given form ID.
     */
    hasDraft(formId: string): boolean {
        return this.getDraft(formId) !== null;
    }

    /**
     * Clear a saved draft.
     */
    clearDraft(formId: string): void {
        try {
            const key = this.getStorageKey(formId);
            localStorage.removeItem(key);
            this.clearAutoSaveTimer(formId);
        } catch (e) {
            console.warn(`Failed to clear draft for form ${formId}:`, e);
        }
    }

    /**
     * Clear all saved drafts.
     */
    clearAllDrafts(): void {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (key.startsWith(STORAGE_KEY_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            this.autoSaveTimers.clear();
        } catch (e) {
            console.warn('Failed to clear all drafts:', e);
        }
    }

    /**
     * Get all saved drafts (useful for recovery UI).
     */
    getAllDrafts(): FormDraft[] {
        try {
            const keys = Object.keys(localStorage);
            const drafts: FormDraft[] = [];

            keys.forEach((key) => {
                if (key.startsWith(STORAGE_KEY_PREFIX)) {
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        try {
                            const draft: FormDraft = JSON.parse(stored);
                            // Filter out expired drafts
                            if (!draft.expiresAt || draft.expiresAt >= Date.now()) {
                                drafts.push(draft);
                            } else {
                                localStorage.removeItem(key);
                            }
                        } catch (e) {
                            // Skip malformed drafts
                        }
                    }
                }
            });

            return drafts.sort((a, b) => b.savedAt - a.savedAt);
        } catch (e) {
            console.warn('Failed to retrieve all drafts:', e);
            return [];
        }
    }

    /**
     * Set up auto-save for a form (debounced).
     */
    setupAutoSave(
        formId: string,
        getFormData: () => Record<string, any>,
        debounceMs: number = 1000,
    ): () => void {
        const save = () => {
            const data = getFormData();
            this.saveDraft(formId, data);
        };

        const timer = setInterval(save, debounceMs);
        this.autoSaveTimers.set(formId, timer);

        return () => {
            this.clearAutoSaveTimer(formId);
        };
    }

    private clearAutoSaveTimer(formId: string): void {
        const timer = this.autoSaveTimers.get(formId);
        if (timer) {
            clearInterval(timer);
            this.autoSaveTimers.delete(formId);
        }
    }

    private getStorageKey(formId: string): string {
        return `${STORAGE_KEY_PREFIX}${formId}`;
    }
}

export default DraftRecoveryService.getInstance();
