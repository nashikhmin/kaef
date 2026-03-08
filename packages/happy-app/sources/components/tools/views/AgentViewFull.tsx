import * as React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { ToolViewProps } from './_all';
import { MarkdownView } from '../../markdown/MarkdownView';
import { CodeView } from '../../CodeView';
import { toolFullViewStyles } from '../ToolFullView';
import { t } from '@/text';

export const AgentViewFull = React.memo<ToolViewProps>(({ tool }) => {
    const prompt = tool.input?.prompt;
    const description = tool.input?.description;
    const subagentType = tool.input?.subagent_type;

    return (
        <>
            {/* Description */}
            {description && (
                <View style={toolFullViewStyles.section}>
                    <View style={toolFullViewStyles.sectionHeader}>
                        <Ionicons name="information-circle" size={20} color="#5856D6" />
                        <Text style={toolFullViewStyles.sectionTitle}>{t('tools.fullView.description')}</Text>
                    </View>
                    <Text style={toolFullViewStyles.description}>{description}</Text>
                </View>
            )}

            {/* Prompt as rendered markdown */}
            {typeof prompt === 'string' && prompt.trim() && (
                <View style={toolFullViewStyles.section}>
                    <View style={toolFullViewStyles.sectionHeader}>
                        <Ionicons name="document-text" size={20} color="#5856D6" />
                        <Text style={toolFullViewStyles.sectionTitle}>{t('tools.agentView.prompt')}</Text>
                    </View>
                    <View style={styles.promptContainer}>
                        <MarkdownView markdown={prompt} />
                    </View>
                </View>
            )}

            {/* Result/Output */}
            {tool.state === 'completed' && tool.result && (
                <View style={toolFullViewStyles.section}>
                    <View style={toolFullViewStyles.sectionHeader}>
                        <Ionicons name="log-out" size={20} color="#34C759" />
                        <Text style={toolFullViewStyles.sectionTitle}>{t('tools.fullView.output')}</Text>
                    </View>
                    <CodeView
                        code={typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)}
                    />
                </View>
            )}

            {/* Error Details */}
            {tool.state === 'error' && tool.result && (
                <View style={toolFullViewStyles.section}>
                    <View style={toolFullViewStyles.sectionHeader}>
                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                        <Text style={toolFullViewStyles.sectionTitle}>{t('tools.fullView.error')}</Text>
                    </View>
                    <View style={toolFullViewStyles.errorContainer}>
                        <Text style={toolFullViewStyles.errorText}>{String(tool.result)}</Text>
                    </View>
                </View>
            )}

            {/* Completed with no output */}
            {tool.state === 'completed' && !tool.result && (
                <View style={toolFullViewStyles.section}>
                    <View style={toolFullViewStyles.emptyOutputContainer}>
                        <Ionicons name="checkmark-circle-outline" size={48} color="#34C759" />
                        <Text style={toolFullViewStyles.emptyOutputText}>{t('tools.fullView.completed')}</Text>
                        <Text style={toolFullViewStyles.emptyOutputSubtext}>{t('tools.fullView.noOutput')}</Text>
                    </View>
                </View>
            )}
        </>
    );
});

const styles = StyleSheet.create((theme) => ({
    promptContainer: {
        backgroundColor: theme.colors.surfaceHigh,
        borderRadius: 8,
        padding: 12,
    },
}));
