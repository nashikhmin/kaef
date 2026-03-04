import { describe, expect, it } from 'vitest';
import { calculateUnifiedDiff } from './calculateDiff';

function getChangedLines(oldText: string, newText: string) {
    const result = calculateUnifiedDiff(oldText, newText, 1);
    const lines = result.hunks.flatMap((hunk) => hunk.lines);
    const removed = lines.find((line) => line.type === 'remove');
    const added = lines.find((line) => line.type === 'add');

    return { removed, added };
}

describe('calculateUnifiedDiff inline refinement', () => {
    it('highlights changed parts inside a word', () => {
        const oldLine = "const color = 'term-green';";
        const newLine = "const color = 'term-emerald';";
        const { removed, added } = getChangedLines(oldLine, newLine);

        expect(removed).toBeDefined();
        expect(added).toBeDefined();

        const removedTokens = removed?.tokens ?? [];
        const addedTokens = added?.tokens ?? [];

        expect(removedTokens.map((token) => token.value).join('')).toBe(oldLine);
        expect(addedTokens.map((token) => token.value).join('')).toBe(newLine);

        expect(removedTokens.some((token) => token.removed)).toBe(true);
        expect(addedTokens.some((token) => token.added)).toBe(true);

        // Ensure we keep shared prefix as unchanged token and only mark changed suffix.
        expect(removedTokens.some((token) => !token.removed && token.value.includes('term-'))).toBe(true);
        expect(addedTokens.some((token) => !token.added && token.value.includes('term-'))).toBe(true);
    });

    it('does not force char-level refinement for whitespace-only changes', () => {
        const oldLine = 'const value = 1;';
        const newLine = 'const  value = 1;';
        const { removed, added } = getChangedLines(oldLine, newLine);

        expect(removed).toBeDefined();
        expect(added).toBeDefined();

        const removedTokens = removed?.tokens ?? [];
        const addedTokens = added?.tokens ?? [];

        // Keep whitespace token as a whole token pair from word diff.
        // Char-level refinement would split this to unchanged+added single space.
        expect(removedTokens.some((token) => token.removed && token.value === ' ')).toBe(true);
        expect(addedTokens.some((token) => token.added && token.value === '  ')).toBe(true);
    });
});
