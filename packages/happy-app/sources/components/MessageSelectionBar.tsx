import * as React from 'react';
import { View, Pressable, Animated } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from './StyledText';
import { Typography } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { storeTempText } from '@/sync/persistence';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@/utils/responsive';
import { t } from '@/text';

export const MessageSelectionBar = React.memo((props: {
    text: string;
    onClose: () => void;
}) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const router = useRouter();
    const safeArea = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleClose = React.useCallback(() => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
        }).start(() => {
            props.onClose();
        });
    }, [props.onClose]);

    const handleCopy = React.useCallback(async () => {
        try {
            await Clipboard.setStringAsync(props.text);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
        handleClose();
    }, [props.text, handleClose]);

    const handleSelectText = React.useCallback(() => {
        try {
            const textId = storeTempText(props.text);
            router.push(`/text-selection?textId=${textId}`);
        } catch (error) {
            console.error('Failed to open text selection:', error);
        }
        handleClose();
    }, [props.text, router, handleClose]);

    return (
        <Animated.View style={[styles.container, { top: safeArea.top + headerHeight }, { opacity: fadeAnim }]}>
            <View style={styles.bar}>
                <Pressable style={styles.button} onPress={handleCopy}>
                    <Ionicons name="copy-outline" size={20} style={styles.icon} />
                    <Text style={styles.buttonText}>{t('common.copy')}</Text>
                </Pressable>
                <Pressable style={styles.button} onPress={handleSelectText}>
                    <Ionicons name="text-outline" size={20} style={styles.icon} />
                    <Text style={styles.buttonText}>{t('textSelection.selectText')}</Text>
                </Pressable>
                <Pressable style={styles.closeButton} onPress={handleClose}>
                    <Ionicons name="close" size={20} style={styles.icon} />
                </Pressable>
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create((theme) => ({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 100,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceHighest,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 6,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    closeButton: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 4,
    },
    buttonText: {
        ...Typography.default(),
        fontSize: 14,
        color: theme.colors.text,
    },
    icon: {
        color: theme.colors.text,
    },
}));
