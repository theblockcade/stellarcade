import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import DraftRecoveryService from '../../src/services/draft-recovery';

describe('DraftRecoveryService', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('saveDraft', () => {
        it('should save a draft to localStorage', () => {
            const service = DraftRecoveryService;
            const formId = 'test-form';
            const data = { name: 'John', email: 'john@example.com' };

            service.saveDraft(formId, data);

            const stored = localStorage.getItem('stc_form_draft_v1_test-form');
            expect(stored).toBeTruthy();

            const parsed = JSON.parse(stored!);
            expect(parsed.formId).toBe(formId);
            expect(parsed.data).toEqual(data);
            expect(parsed.savedAt).toBeTruthy();
        });

        it('should include expiration timestamp', () => {
            const service = DraftRecoveryService;
            const formId = 'test-form';
            const data = { test: 'data' };

            service.saveDraft(formId, data);

            const stored = localStorage.getItem('stc_form_draft_v1_test-form');
            const parsed = JSON.parse(stored!);

            expect(parsed.expiresAt).toBeTruthy();
            expect(parsed.expiresAt).toBeGreaterThan(parsed.savedAt);
        });
    });

    describe('getDraft', () => {
        it('should retrieve a saved draft', () => {
            const service = DraftRecoveryService;
            const formId = 'test-form';
            const data = { name: 'Jane' };

            service.saveDraft(formId, data);
            const retrieved = service.getDraft(formId);

            expect(retrieved).toBeTruthy();
            expect(retrieved?.formId).toBe(formId);
            expect(retrieved?.data).toEqual(data);
        });

        it('should return null for non-existent draft', () => {
            const service = DraftRecoveryService;
            const retrieved = service.getDraft('non-existent');

            expect(retrieved).toBeNull();
        });

        it('should return null for expired draft', () => {
            const service = DraftRecoveryService;
            const formId = 'test-form';
            const data = { test: 'data' };

            service.saveDraft(formId, data);

            // Manually set expiration to past
            const stored = localStorage.getItem('stc_form_draft_v1_test-form');
            const parsed = JSON.parse(stored!);
            parsed.expiresAt = Date.now() - 1000;
            localStorage.setItem('stc_form_draft_v1_test-form', JSON.stringify(parsed));

            const retrieved = service.getDraft(formId);
            expect(retrieved).toBeNull();
        });
    });

    describe('hasDraft', () => {
        it('should return true if draft exists', () => {
            const service = DraftRecoveryService;
            const formId = 'test-form';

            service.saveDraft(formId, { test: 'data' });
            expect(service.hasDraft(formId)).toBe(true);
        });

        it('should return false if draft does not exist', () => {
            const service = DraftRecoveryService;
            expect(service.hasDraft('non-existent')).toBe(false);
        });
    });

    describe('clearDraft', () => {
        it('should remove a draft from localStorage', () => {
            const service = DraftRecoveryService;
            const formId = 'test-form';

            service.saveDraft(formId, { test: 'data' });
            expect(service.hasDraft(formId)).toBe(true);

            service.clearDraft(formId);
            expect(service.hasDraft(formId)).toBe(false);
        });
    });
});
