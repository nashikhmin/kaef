import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        zIndex: 1,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.shadow.color,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        shadowOpacity: theme.colors.shadow.opacity,
        elevation: 4,
    },
    buttonDefault: {
        backgroundColor: theme.colors.fab.background,
    },
    buttonPressed: {
        backgroundColor: theme.colors.fab.backgroundPressed,
    },
}));

export const ChatScrollToBottomButton = React.memo((props: { onPress: () => void }) => {
    const { theme } = useUnistyles();
    const styles = stylesheet;

    return (
        <View pointerEvents="box-none" style={styles.container}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Scroll to latest messages"
                hitSlop={8}
                onPress={props.onPress}
                style={({ pressed }) => [
                    styles.button,
                    pressed ? styles.buttonPressed : styles.buttonDefault,
                ]}
            >
                <Ionicons name="arrow-down" size={20} color={theme.colors.fab.icon} />
            </Pressable>
        </View>
    );
});
