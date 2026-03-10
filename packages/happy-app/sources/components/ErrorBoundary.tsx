import * as React from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MAX_RETRIES = 2;

type ErrorBoundaryProps = {
    error: Error;
    retry: () => void;
};

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
    const { theme } = useUnistyles();
    const router = useRouter();
    const [copied, setCopied] = React.useState(false);
    const retryCountRef = React.useRef(0);
    const exhausted = retryCountRef.current >= MAX_RETRIES;

    const errorText = `${error.name}: ${error.message}\n\n${error.stack ?? 'No stack trace'}`;

    const handleCopy = React.useCallback(async () => {
        await Clipboard.setStringAsync(errorText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [errorText]);

    const handleRetry = React.useCallback(() => {
        retryCountRef.current++;
        retry();
    }, [retry]);

    const handleGoBack = React.useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    }, [router]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="bug-outline" size={32} color={theme.colors.box.error.text} />
                <Text style={styles.title}>Something crashed</Text>
            </View>

            {exhausted && (
                <Text style={styles.exhaustedText}>
                    Retry didn't help. You can copy the error and go back.
                </Text>
            )}

            <View style={styles.errorBox}>
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.errorName}>{error.name}: {error.message}</Text>
                    {error.stack && (
                        <Text style={styles.stackText}>{error.stack}</Text>
                    )}
                </ScrollView>
            </View>

            <View style={styles.buttons}>
                <Pressable style={styles.copyButton} onPress={handleCopy}>
                    <Ionicons
                        name={copied ? 'checkmark' : 'copy-outline'}
                        size={18}
                        color={theme.colors.box.error.text}
                    />
                    <Text style={styles.copyButtonText}>
                        {copied ? 'Copied' : 'Copy'}
                    </Text>
                </Pressable>

                {exhausted ? (
                    <Pressable style={styles.retryButton} onPress={handleGoBack}>
                        <Ionicons name="arrow-back" size={18} color="#fff" />
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </Pressable>
                ) : (
                    <Pressable style={styles.retryButton} onPress={handleRetry}>
                        <Ionicons name="refresh" size={18} color="#fff" />
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

/**
 * Wraps a component so that if it crashes during render,
 * it shows a compact inline error indicator instead of taking down the whole screen.
 * Tap to copy the full error + stack trace.
 */
type SafeRenderProps = {
    children: React.ReactNode;
    fallback?: React.ReactNode;
};

type SafeRenderState = {
    error: Error | null;
};

export class SafeRender extends React.Component<SafeRenderProps, SafeRenderState> {
    state: SafeRenderState = { error: null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[SafeRender] Component crashed:', error, info.componentStack);
    }

    render() {
        if (this.state.error) {
            return this.props.fallback ?? <SafeRenderFallback error={this.state.error} />;
        }
        return this.props.children;
    }
}

function SafeRenderFallback({ error }: { error: Error }) {
    const { theme } = useUnistyles();
    const [copied, setCopied] = React.useState(false);

    const handleCopy = React.useCallback(async () => {
        const text = `${error.name}: ${error.message}\n\n${error.stack ?? 'No stack trace'}`;
        await Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [error]);

    return (
        <Pressable style={safeRenderStyles.container} onPress={handleCopy}>
            <Ionicons name="bug-outline" size={14} color={theme.colors.box.error.text} />
            <Text style={safeRenderStyles.text} numberOfLines={1}>
                {error.message}
            </Text>
            <Text style={safeRenderStyles.copyHint}>
                {copied ? 'Copied!' : 'Tap to copy'}
            </Text>
        </Pressable>
    );
}

const safeRenderStyles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.box.error.background,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginVertical: 2,
        borderWidth: 1,
        borderColor: theme.colors.box.error.border,
    },
    text: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.box.error.text,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    copyHint: {
        fontSize: 11,
        color: theme.colors.box.error.text,
        opacity: 0.6,
    },
}));

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.groupped.background,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.typography,
    },
    exhaustedText: {
        fontSize: 14,
        color: theme.colors.secondaryLabel,
        marginBottom: 12,
    },
    errorBox: {
        backgroundColor: theme.colors.box.error.background,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.box.error.border,
        maxHeight: 400,
        overflow: 'hidden',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 14,
    },
    errorName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.box.error.text,
        marginBottom: 8,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    stackText: {
        fontSize: 12,
        color: theme.colors.box.error.text,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
        lineHeight: 18,
        opacity: 0.85,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.box.error.border,
        backgroundColor: theme.colors.box.error.background,
    },
    copyButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.box.error.text,
    },
    retryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: theme.colors.box.error.border,
    },
    retryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
}));
