import * as React from 'react';
import { useSession, useSessionMessages } from "@/sync/storage";
import {
    FlatList,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    View,
} from 'react-native';
import { useCallback } from 'react';
import { useHeaderHeight } from '@/utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageView } from './MessageView';
import { Metadata, Session } from '@/sync/storageTypes';
import { ChatFooter } from './ChatFooter';
import { Message } from '@/sync/typesMessage';
import { StyleSheet } from 'react-native-unistyles';
import { shouldShowScrollToBottom } from './chatScrollToBottom';
import { ChatScrollToBottomButton } from './ChatScrollToBottomButton';
import { MessageSelectionBar } from './MessageSelectionBar';

const stylesheet = StyleSheet.create(() => ({
    listContainer: {
        flex: 1,
    },
}));

export const ChatList = React.memo((props: { session: Session }) => {
    const { messages } = useSessionMessages(props.session.id);
    return (
        <ChatListInternal
            metadata={props.session.metadata}
            sessionId={props.session.id}
            messages={messages}
        />
    )
});

const ListHeader = React.memo(() => {
    const headerHeight = useHeaderHeight();
    const safeArea = useSafeAreaInsets();
    return <View style={{ flexDirection: 'row', alignItems: 'center', height: headerHeight + safeArea.top + 32 }} />;
});

const ListFooter = React.memo((props: { sessionId: string }) => {
    const session = useSession(props.sessionId)!;
    return (
        <ChatFooter controlledByUser={session.agentState?.controlledByUser || false} />
    )
});

const ChatListInternal = React.memo((props: {
    metadata: Metadata | null,
    sessionId: string,
    messages: Message[],
}) => {
    const styles = stylesheet;
    const listRef = React.useRef<FlatList<Message>>(null);
    const metricsRef = React.useRef<{ distanceToBottom: number, scrollableDistance: number }>({
        distanceToBottom: 0,
        scrollableDistance: 0,
    });
    const [viewportHeight, setViewportHeight] = React.useState(0);
    const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);

    // Message selection state
    const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(null);
    const [selectedMessageText, setSelectedMessageText] = React.useState<string>('');

    const handleMessageLongPress = useCallback((messageId: string, text: string) => {
        setSelectedMessageId(messageId);
        setSelectedMessageText(text);
    }, []);

    const handleSelectionClose = useCallback(() => {
        setSelectedMessageId(null);
        setSelectedMessageText('');
    }, []);

    const updateScrollToBottomVisibility = useCallback((distanceToBottom: number, scrollableDistance: number, viewport: number) => {
        setShowScrollToBottom((prev) => {
            return shouldShowScrollToBottom({
                prevVisible: prev,
                distanceToBottom,
                scrollableDistance,
                viewportHeight: viewport,
            });
        });
    }, []);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const nextViewportHeight = event.nativeEvent.layout.height;
        setViewportHeight(nextViewportHeight);
        updateScrollToBottomVisibility(
            metricsRef.current.distanceToBottom,
            metricsRef.current.scrollableDistance,
            nextViewportHeight
        );
    }, [updateScrollToBottomVisibility]);

    const handleContentSizeChange = useCallback((_: number, contentHeight: number) => {
        const scrollableDistance = Math.max(contentHeight - viewportHeight, 0);
        metricsRef.current = {
            ...metricsRef.current,
            scrollableDistance,
        };
        updateScrollToBottomVisibility(
            metricsRef.current.distanceToBottom,
            scrollableDistance,
            viewportHeight
        );
    }, [viewportHeight, updateScrollToBottomVisibility]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const nextViewport = layoutMeasurement.height || viewportHeight;
        const distanceToBottom = Math.max(contentOffset.y, 0);
        const scrollableDistance = Math.max(contentSize.height - layoutMeasurement.height, 0);
        metricsRef.current = { distanceToBottom, scrollableDistance };
        updateScrollToBottomVisibility(distanceToBottom, scrollableDistance, nextViewport);

        // Dismiss selection on scroll
        if (selectedMessageId) {
            setSelectedMessageId(null);
            setSelectedMessageText('');
        }
    }, [viewportHeight, updateScrollToBottomVisibility, selectedMessageId]);

    const handleScrollToBottomPress = useCallback(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    const keyExtractor = useCallback((item: Message) => item.id, []);
    const renderItem = useCallback(({ item }: { item: Message }) => (
        <MessageView
            message={item}
            metadata={props.metadata}
            sessionId={props.sessionId}
            isSelected={item.id === selectedMessageId}
            onLongPress={handleMessageLongPress}
        />
    ), [props.metadata, props.sessionId, selectedMessageId, handleMessageLongPress]);

    return (
        <View style={styles.listContainer} onLayout={handleLayout}>
            <FlatList
                ref={listRef}
                data={props.messages}
                inverted={true}
                keyExtractor={keyExtractor}
                maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                    autoscrollToTopThreshold: 10,
                }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onContentSizeChange={handleContentSizeChange}
                renderItem={renderItem}
                ListHeaderComponent={<ListFooter sessionId={props.sessionId} />}
                ListFooterComponent={<ListHeader />}
            />
            {showScrollToBottom && (
                <ChatScrollToBottomButton onPress={handleScrollToBottomPress} />
            )}
            {selectedMessageId && (
                <MessageSelectionBar
                    text={selectedMessageText}
                    onClose={handleSelectionClose}
                />
            )}
        </View>
    )
});
