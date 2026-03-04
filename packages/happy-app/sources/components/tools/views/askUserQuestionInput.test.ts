import { describe, expect, it } from 'vitest';
import { normalizeAskUserQuestionInput } from './askUserQuestionInput';

describe('normalizeAskUserQuestionInput', () => {
    it('returns normalized questions for valid payload', () => {
        const result = normalizeAskUserQuestionInput({
            questions: [
                {
                    question: 'Proceed with migration?',
                    header: 'Migration',
                    options: [
                        { label: 'Yes', description: 'Apply schema changes' },
                        { label: 'No', description: 'Skip migration' },
                    ],
                    multiSelect: false,
                },
            ],
        });

        expect(result).toEqual([
            {
                question: 'Proceed with migration?',
                header: 'Migration',
                options: [
                    { label: 'Yes', description: 'Apply schema changes' },
                    { label: 'No', description: 'Skip migration' },
                ],
                multiSelect: false,
            },
        ]);
    });

    it('returns empty array for invalid payload shape', () => {
        expect(normalizeAskUserQuestionInput(null)).toEqual([]);
        expect(normalizeAskUserQuestionInput({})).toEqual([]);
        expect(normalizeAskUserQuestionInput({ questions: 'invalid' })).toEqual([]);
    });

    it('filters invalid questions and options', () => {
        const result = normalizeAskUserQuestionInput({
            questions: [
                {
                    question: '  ',
                    header: 'Broken',
                    options: [{ label: 'A' }],
                    multiSelect: false,
                },
                {
                    question: 'Pick a mode',
                    header: 'Mode',
                    options: [
                        { label: '' },
                        { foo: 'bar' },
                        { label: 'Safe', description: 123 },
                    ],
                    multiSelect: true,
                },
            ],
        });

        expect(result).toEqual([
            {
                question: 'Pick a mode',
                header: 'Mode',
                options: [{ label: 'Safe', description: undefined }],
                multiSelect: true,
            },
        ]);
    });
});
