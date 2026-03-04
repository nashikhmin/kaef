import { describe, expect, it, vi } from 'vitest';

vi.mock('./EditView', () => ({ EditView: () => null }));
vi.mock('./BashView', () => ({ BashView: () => null }));
vi.mock('./WriteView', () => ({ WriteView: () => null }));
vi.mock('./TodoView', () => ({ TodoView: () => null }));
vi.mock('./ExitPlanToolView', () => ({ ExitPlanToolView: () => null }));
vi.mock('./MultiEditView', () => ({ MultiEditView: () => null }));
vi.mock('./TaskView', () => ({ TaskView: () => null }));
vi.mock('./BashViewFull', () => ({ BashViewFull: () => null }));
vi.mock('./EditViewFull', () => ({ EditViewFull: () => null }));
vi.mock('./MultiEditViewFull', () => ({ MultiEditViewFull: () => null }));
vi.mock('./CodexBashView', () => ({ CodexBashView: () => null }));
vi.mock('./CodexPatchView', () => ({ CodexPatchView: () => null }));
vi.mock('./CodexDiffView', () => ({ CodexDiffView: () => null }));
vi.mock('./AskUserQuestionView', () => ({ AskUserQuestionView: () => null }));
vi.mock('./GeminiEditView', () => ({ GeminiEditView: () => null }));
vi.mock('./GeminiExecuteView', () => ({ GeminiExecuteView: () => null }));

describe('tool view registries', () => {
    it('registers AskUserQuestion for both inline and full tool views', async () => {
        const { getToolViewComponent, getToolFullViewComponent } = await import('./_all');

        expect(getToolViewComponent('AskUserQuestion')).toBeTypeOf('function');
        expect(getToolFullViewComponent('AskUserQuestion')).toBeTypeOf('function');
    });

    it('returns null for unknown tools', async () => {
        const { getToolViewComponent, getToolFullViewComponent } = await import('./_all');

        expect(getToolViewComponent('UnknownTool')).toBeNull();
        expect(getToolFullViewComponent('UnknownTool')).toBeNull();
    });
});
