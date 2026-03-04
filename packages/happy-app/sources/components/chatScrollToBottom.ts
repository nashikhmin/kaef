export const SCROLL_TO_BOTTOM_SHOW_SCREENS = 3;
export const SCROLL_TO_BOTTOM_HIDE_SCREENS = 2.5;

export function shouldShowScrollToBottom(params: {
    prevVisible: boolean;
    distanceToBottom: number;
    scrollableDistance: number;
    viewportHeight: number;
}): boolean {
    const { prevVisible, distanceToBottom, scrollableDistance, viewportHeight } = params;
    if (viewportHeight <= 0 || scrollableDistance <= 0) {
        return false;
    }

    const showThreshold = viewportHeight * SCROLL_TO_BOTTOM_SHOW_SCREENS;
    const hideThreshold = viewportHeight * SCROLL_TO_BOTTOM_HIDE_SCREENS;
    return prevVisible ? distanceToBottom > hideThreshold : distanceToBottom > showThreshold;
}
