import { describe, expect, it } from 'vitest';
import {
    SCROLL_TO_BOTTOM_HIDE_SCREENS,
    SCROLL_TO_BOTTOM_SHOW_SCREENS,
    shouldShowScrollToBottom,
} from './chatScrollToBottom';

describe('shouldShowScrollToBottom', () => {
    it('returns false when viewport height is invalid', () => {
        expect(shouldShowScrollToBottom({
            prevVisible: false,
            distanceToBottom: 10_000,
            scrollableDistance: 10_000,
            viewportHeight: 0,
        })).toBe(false);
    });

    it('returns false when list is not scrollable', () => {
        expect(shouldShowScrollToBottom({
            prevVisible: false,
            distanceToBottom: 10_000,
            scrollableDistance: 0,
            viewportHeight: 500,
        })).toBe(false);
    });

    it('shows only above the show threshold when currently hidden', () => {
        const viewportHeight = 400;
        const showThreshold = viewportHeight * SCROLL_TO_BOTTOM_SHOW_SCREENS;

        expect(shouldShowScrollToBottom({
            prevVisible: false,
            distanceToBottom: showThreshold,
            scrollableDistance: 10_000,
            viewportHeight,
        })).toBe(false);

        expect(shouldShowScrollToBottom({
            prevVisible: false,
            distanceToBottom: showThreshold + 1,
            scrollableDistance: 10_000,
            viewportHeight,
        })).toBe(true);
    });

    it('uses hysteresis and stays visible above hide threshold', () => {
        const viewportHeight = 400;
        const hideThreshold = viewportHeight * SCROLL_TO_BOTTOM_HIDE_SCREENS;

        expect(shouldShowScrollToBottom({
            prevVisible: true,
            distanceToBottom: hideThreshold + 1,
            scrollableDistance: 10_000,
            viewportHeight,
        })).toBe(true);
    });

    it('hides when distance reaches hide threshold while already visible', () => {
        const viewportHeight = 400;
        const hideThreshold = viewportHeight * SCROLL_TO_BOTTOM_HIDE_SCREENS;

        expect(shouldShowScrollToBottom({
            prevVisible: true,
            distanceToBottom: hideThreshold,
            scrollableDistance: 10_000,
            viewportHeight,
        })).toBe(false);
    });

    it('does not show in hysteresis zone when currently hidden', () => {
        const viewportHeight = 400;
        const hideThreshold = viewportHeight * SCROLL_TO_BOTTOM_HIDE_SCREENS;
        const showThreshold = viewportHeight * SCROLL_TO_BOTTOM_SHOW_SCREENS;
        const inBetweenDistance = (hideThreshold + showThreshold) / 2;

        expect(shouldShowScrollToBottom({
            prevVisible: false,
            distanceToBottom: inBetweenDistance,
            scrollableDistance: 10_000,
            viewportHeight,
        })).toBe(false);
    });
});
