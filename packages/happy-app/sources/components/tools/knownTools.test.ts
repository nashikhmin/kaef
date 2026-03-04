import { describe, expect, it, vi } from 'vitest';

vi.mock('@/text', () => ({
    t: (key: string) => key,
}));

vi.mock('@/utils/pathUtils', () => ({
    resolvePath: (p: string) => p,
}));

vi.mock('@/sync/storageTypes', () => ({}));
vi.mock('@/sync/typesMessage', () => ({}));

const mockSettings = { collapseDiffs: false };
vi.mock('@/sync/storage', () => ({
    storage: {
        getState: () => ({ settings: mockSettings }),
    },
}));

// Mock react and expo icons to avoid JSX runtime issues
vi.mock('react', () => ({ default: { createElement: () => null }, createElement: () => null }));
vi.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
    Octicons: () => null,
}));

import { knownTools } from './knownTools';

function makeTool(input: Record<string, unknown> = {}) {
    return { input, name: 'Agent', state: 'running' as const } as any;
}

describe('knownTools.Agent', () => {
    const agent = knownTools['Agent'] as any;

    it('returns "Subagent {type}" when subagent_type is provided', () => {
        const title = agent.title({
            metadata: null,
            tool: makeTool({ subagent_type: 'Explore' }),
        });
        expect(title).toBe('tools.names.subagent Explore');
    });

    it('returns fallback title when no subagent_type', () => {
        const title = agent.title({ metadata: null, tool: makeTool({}) });
        expect(title).toBe('tools.names.subagent');
    });

    it('returns fallback title when subagent_type is empty string', () => {
        const title = agent.title({
            metadata: null,
            tool: makeTool({ subagent_type: '   ' }),
        });
        expect(title).toBe('tools.names.subagent');
    });

    it('extracts description as subtitle', () => {
        const subtitle = agent.extractSubtitle({
            tool: makeTool({ description: 'Find diff code' }),
        });
        expect(subtitle).toBe('Find diff code');
    });

    it('returns undefined subtitle when no description', () => {
        const subtitle = agent.extractSubtitle({ tool: makeTool({}) });
        expect(subtitle).toBeUndefined();
    });

    it('is always minimal', () => {
        expect(agent.minimal).toBe(true);
    });
});

describe('knownTools.Edit collapseDiffs', () => {
    const edit = knownTools['Edit'] as any;

    it('is not minimal when collapseDiffs is false', () => {
        mockSettings.collapseDiffs = false;
        expect(edit.minimal()).toBe(false);
    });

    it('is minimal when collapseDiffs is true', () => {
        mockSettings.collapseDiffs = true;
        expect(edit.minimal()).toBe(true);
    });
});

describe('knownTools.Write collapseDiffs', () => {
    const write = knownTools['Write'] as any;

    it('is not minimal when collapseDiffs is false', () => {
        mockSettings.collapseDiffs = false;
        expect(write.minimal()).toBe(false);
    });

    it('is minimal when collapseDiffs is true', () => {
        mockSettings.collapseDiffs = true;
        expect(write.minimal()).toBe(true);
    });
});
