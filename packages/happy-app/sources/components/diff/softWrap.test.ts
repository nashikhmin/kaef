import { describe, expect, it } from 'vitest';
import { insertSoftWrapBreaks, SOFT_WRAP_BREAK } from './softWrap';

describe('insertSoftWrapBreaks', () => {
    it('keeps short segments unchanged', () => {
        const input = 'short value with spaces';
        expect(insertSoftWrapBreaks(input)).toBe(input);
    });

    it('inserts soft wrap breaks into long uninterrupted segments', () => {
        const input = 'a'.repeat(80);
        const output = insertSoftWrapBreaks(input, { chunkSize: 16, minSegmentLength: 20 });

        expect(output).toContain(SOFT_WRAP_BREAK);
        expect(output.replaceAll(SOFT_WRAP_BREAK, '')).toBe(input);
    });

    it('preserves whitespace and wraps multiple long segments independently', () => {
        const first = 'x'.repeat(64);
        const second = 'y'.repeat(72);
        const input = `${first}  ${second}\n${first}`;
        const output = insertSoftWrapBreaks(input, { chunkSize: 24, minSegmentLength: 30 });

        expect(output.replaceAll(SOFT_WRAP_BREAK, '')).toBe(input);
        expect(output.split(SOFT_WRAP_BREAK).length).toBeGreaterThan(3);
    });

    it('does not insert duplicate breakpoints on repeated calls', () => {
        const input = 'z'.repeat(96);
        const once = insertSoftWrapBreaks(input, { chunkSize: 12, minSegmentLength: 20 });
        const twice = insertSoftWrapBreaks(once, { chunkSize: 12, minSegmentLength: 20 });

        expect(twice).toBe(once);
    });
});
