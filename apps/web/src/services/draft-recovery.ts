export interface FormDraft {
  formId: string;
  data: Record<string, any>;
  savedAt: number;
  expiresAt?: number;
}

export interface DraftRecoveryOptions {
  maxAge?: number;
  autoSave?: boolean;
}

const STORAGE_KEY_PREFIX = "stc_form_draft_v1_";
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

  saveDraft(formId: string, data: Record<string, any>): void {
    const draft: FormDraft = {
      formId,
      data,
      savedAt: Date.now(),
      expiresAt: Date.now() + this.maxAge,
    };

    try {
      const key = this.getStorageKey(formId);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(draft));
      }
    } catch (e) {
      console.warn(`Failed to save draft for form ${formId}:`, e);
    }
  }

  getDraft(formId: string): FormDraft | null {
    try {
      const key = this.getStorageKey(formId);
      if (typeof window === "undefined" || !window.localStorage) return null;
      const stored = window.localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const draft: FormDraft = JSON.parse(stored);

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

  hasDraft(formId: string): boolean {
    return this.getDraft(formId) !== null;
  }

  clearDraft(formId: string): void {
    try {
      const key = this.getStorageKey(formId);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      this.clearAutoSaveTimer(formId);
    } catch (e) {
      console.warn(`Failed to clear draft for form ${formId}:`, e);
    }
  }

  clearAllDrafts(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const keys = Object.keys(window.localStorage);
        keys.forEach((key) => {
          if (key.startsWith(STORAGE_KEY_PREFIX)) {
            window.localStorage.removeItem(key);
          }
        });
      }
      this.autoSaveTimers.clear();
    } catch (e) {
      console.warn("Failed to clear all drafts:", e);
    }
  }

  getAllDrafts(): FormDraft[] {
    try {
      if (typeof window === "undefined" || !window.localStorage) return [];
      const keys = Object.keys(window.localStorage);
      const drafts: FormDraft[] = [];

      keys.forEach((key) => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          const stored = window.localStorage.getItem(key);
          if (stored) {
            try {
              const draft: FormDraft = JSON.parse(stored);
              if (!draft.expiresAt || draft.expiresAt >= Date.now()) {
                drafts.push(draft);
              } else {
                window.localStorage.removeItem(key);
              }
            } catch {
              // skip
            }
          }
        }
      });

      return drafts.sort((a, b) => b.savedAt - a.savedAt);
    } catch (e) {
      console.warn("Failed to retrieve all drafts:", e);
      return [];
    }
  }

  setupAutoSave(
    formId: string,
    getFormData: () => Record<string, any>,
    debounceMs: number = 1000
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
