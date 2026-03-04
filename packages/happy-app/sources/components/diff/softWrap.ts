export const SOFT_WRAP_BREAK = '\u200b';

interface SoftWrapOptions {
    chunkSize?: number;
    minSegmentLength?: number;
}

/**
 * Inserts soft wrap breakpoints into long non-whitespace segments.
 *
 * React Native text wrapping can struggle with very long uninterrupted
 * strings (paths, hashes, minified snippets). Zero-width spaces provide
 * optional wrap points without changing visual output.
 */
export function insertSoftWrapBreaks(
    input: string,
    options: SoftWrapOptions = {}
): string {
    const chunkSize = Math.max(1, Math.floor(options.chunkSize ?? 32));
    const minSegmentLength = Math.max(1, Math.floor(options.minSegmentLength ?? 48));

    if (input.length < minSegmentLength) {
        return input;
    }

    return input.replace(/\S+/g, (segment) => {
        if (segment.length < minSegmentLength || segment.includes(SOFT_WRAP_BREAK)) {
            return segment;
        }

        const parts: string[] = [];
        for (let index = 0; index < segment.length; index += chunkSize) {
            parts.push(segment.slice(index, index + chunkSize));
        }

        return parts.join(SOFT_WRAP_BREAK);
    });
}
