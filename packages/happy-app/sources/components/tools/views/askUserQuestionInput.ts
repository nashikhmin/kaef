export interface QuestionOption {
    label: string;
    description?: string;
}

export interface Question {
    question: string;
    header: string;
    options: QuestionOption[];
    multiSelect: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

export function normalizeAskUserQuestionInput(input: unknown): Question[] {
    if (!isRecord(input) || !Array.isArray(input.questions)) {
        return [];
    }

    const questions: Question[] = [];
    for (const rawQuestion of input.questions) {
        if (!isRecord(rawQuestion)) {
            continue;
        }

        const question = typeof rawQuestion.question === 'string' ? rawQuestion.question.trim() : '';
        const header = typeof rawQuestion.header === 'string' ? rawQuestion.header.trim() : '';
        const multiSelect = typeof rawQuestion.multiSelect === 'boolean' ? rawQuestion.multiSelect : false;
        const rawOptions = Array.isArray(rawQuestion.options) ? rawQuestion.options : [];

        if (!question || !header || rawOptions.length === 0) {
            continue;
        }

        const options: QuestionOption[] = [];
        for (const rawOption of rawOptions) {
            if (!isRecord(rawOption) || typeof rawOption.label !== 'string') {
                continue;
            }

            const label = rawOption.label.trim();
            if (!label) {
                continue;
            }

            options.push({
                label,
                description: typeof rawOption.description === 'string' ? rawOption.description : undefined,
            });
        }

        if (options.length === 0) {
            continue;
        }

        questions.push({
            question,
            header,
            options,
            multiSelect,
        });
    }

    return questions;
}
