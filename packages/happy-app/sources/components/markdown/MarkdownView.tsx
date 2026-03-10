import { MarkdownBlock, MarkdownSpan, parseMarkdown } from './parseMarkdown';
import { Link } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, View, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '../StyledText';
import { Typography } from '@/constants/Typography';
import { SimpleSyntaxHighlighter } from '../SimpleSyntaxHighlighter';
import { Modal } from '@/modal';
import { useLocalSetting } from '@/sync/storage';
import { storeTempText } from '@/sync/persistence';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { MermaidRenderer } from './MermaidRenderer';
import { t } from '@/text';
import { hapticsLight } from '../haptics';

// Option type for callback
export type Option = {
    title: string;
};

// Check if a block can be rendered as nested <Text> (no View needed)
function isInlineableBlock(block: MarkdownBlock): boolean {
    return block.type !== 'mermaid' && block.type !== 'options';
}

export const MarkdownView = React.memo((props: {
    markdown: string;
    onOptionPress?: (option: Option) => void;
}) => {
    const blocks = React.useMemo(() => parseMarkdown(props.markdown), [props.markdown]);

    const markdownCopyV2 = useLocalSetting('markdownCopyV2');
    const useInlineMode = !markdownCopyV2;
    const router = useRouter();

    const handleLongPress = React.useCallback(() => {
        try {
            hapticsLight();
            const textId = storeTempText(props.markdown);
            router.push(`/text-selection?textId=${textId}`);
        } catch (error) {
            console.error('Error storing text for selection:', error);
            Modal.alert('Error', 'Failed to open text selection. Please try again.');
        }
    }, [props.markdown, router]);

    // Group consecutive inlineable blocks into a single <Text selectable>
    // so selection flows across block boundaries
    if (useInlineMode) {
        const tempGroups: ({ type: 'inline', blocks: MarkdownBlock[] } | { type: 'view', block: MarkdownBlock })[] = [];

        for (const block of blocks) {
            if (isInlineableBlock(block)) {
                const lastGroup = tempGroups[tempGroups.length - 1];
                if (lastGroup && lastGroup.type === 'inline') {
                    lastGroup.blocks.push(block);
                } else {
                    tempGroups.push({ type: 'inline', blocks: [block] });
                }
            } else {
                tempGroups.push({ type: 'view', block });
            }
        }

        return (
            <View style={{ width: '100%' }}>
                {tempGroups.map((group, groupIndex) => {
                    if (group.type === 'inline') {
                        return (
                            <Text selectable key={groupIndex} style={style.inlineGroup}>
                                {group.blocks.map((block, blockIndex) =>
                                    renderBlockInline(block, blockIndex, blockIndex > 0)
                                )}
                            </Text>
                        );
                    } else {
                        const block = group.block;
                        if (block.type === 'mermaid') {
                            return <MermaidRenderer content={block.content} key={groupIndex} />;
                        } else if (block.type === 'options') {
                            return <RenderOptionsBlock items={block.items} key={groupIndex} first={false} last={false} selectable={true} onOptionPress={props.onOptionPress} />;
                        }
                        return null;
                    }
                })}
            </View>
        );
    }

    // markdownCopyV2 mode: long press opens full-screen text selection
    const longPressGesture = Gesture.LongPress()
        .minDuration(300)
        .maxDistance(30)
        .onStart(() => {
            handleLongPress();
        })
        .runOnJS(true);

    return (
        <GestureDetector gesture={longPressGesture}>
            <View style={{ width: '100%' }}>
                <View style={{ width: '100%' }}>
                    {blocks.map((block, index) => {
                        if (block.type === 'text') {
                            return <RenderTextBlock spans={block.content} key={index} first={index === 0} last={index === blocks.length - 1} selectable={false} />;
                        } else if (block.type === 'header') {
                            return <RenderHeaderBlock level={block.level} spans={block.content} key={index} first={index === 0} last={index === blocks.length - 1} selectable={false} />;
                        } else if (block.type === 'horizontal-rule') {
                            return <View style={style.horizontalRule} key={index} />;
                        } else if (block.type === 'list') {
                            return <RenderListBlock items={block.items} key={index} first={index === 0} last={index === blocks.length - 1} selectable={false} />;
                        } else if (block.type === 'numbered-list') {
                            return <RenderNumberedListBlock items={block.items} key={index} first={index === 0} last={index === blocks.length - 1} selectable={false} />;
                        } else if (block.type === 'code-block') {
                            return <RenderCodeBlock content={block.content} language={block.language} key={index} first={index === 0} last={index === blocks.length - 1} selectable={false} />;
                        } else if (block.type === 'mermaid') {
                            return <MermaidRenderer content={block.content} key={index} />;
                        } else if (block.type === 'options') {
                            return <RenderOptionsBlock items={block.items} key={index} first={index === 0} last={index === blocks.length - 1} selectable={false} onOptionPress={props.onOptionPress} />;
                        } else if (block.type === 'table') {
                            return <RenderTableBlock headers={block.headers} rows={block.rows} key={index} first={index === 0} last={index === blocks.length - 1} />;
                        } else {
                            return null;
                        }
                    })}
                </View>
            </View>
        </GestureDetector>
    );
});

// Render a block as nested <Text> elements (for inline mode, no View wrappers)
function renderBlockInline(block: MarkdownBlock, index: number, needsSeparator: boolean): React.ReactNode {
    const sep = needsSeparator ? '\n' : null;
    if (block.type === 'text') {
        return <React.Fragment key={index}>{sep}<Text style={style.inlineText}><RenderSpans spans={block.content} baseStyle={style.inlineText} /></Text></React.Fragment>;
    } else if (block.type === 'header') {
        const s = (style as any)[`header${block.level}`];
        const headerStyle = [style.header, s];
        return <React.Fragment key={index}>{sep}{sep}<Text style={headerStyle}><RenderSpans spans={block.content} baseStyle={headerStyle} /></Text>{'\n'}</React.Fragment>;
    } else if (block.type === 'list') {
        return <React.Fragment key={index}>{sep}{block.items.map((item, i) =>
            <Text key={i} style={style.inlineText}>{i > 0 ? '\n' : ''}{'- '}<RenderSpans spans={item} baseStyle={style.inlineText} /></Text>
        )}{'\n'}</React.Fragment>;
    } else if (block.type === 'numbered-list') {
        return <React.Fragment key={index}>{sep}{block.items.map((item, i) =>
            <Text key={i} style={style.inlineText}>{i > 0 ? '\n' : ''}{`${item.number}. `}<RenderSpans spans={item.spans} baseStyle={style.inlineText} /></Text>
        )}{'\n'}</React.Fragment>;
    } else if (block.type === 'code-block') {
        return <React.Fragment key={index}>{sep}{'\n'}{block.language ? <Text style={style.inlineCodeLanguage}>{block.language}{'\n'}</Text> : null}<Text style={style.inlineCode}>{block.content}</Text>{'\n'}</React.Fragment>;
    } else if (block.type === 'horizontal-rule') {
        return <React.Fragment key={index}>{sep}<Text style={style.inlineHorizontalRule}>{'────────────────────────'}</Text>{'\n'}</React.Fragment>;
    } else if (block.type === 'table') {
        return <React.Fragment key={index}>{sep}{renderTableInline(block.headers, block.rows)}{'\n'}</React.Fragment>;
    }
    return null;
}

// Render a table as formatted text with monospace font
function renderTableInline(headers: string[], rows: string[][]): React.ReactNode {
    // Calculate column widths
    const colWidths = headers.map((h, i) => {
        let max = h.length;
        for (const row of rows) {
            const cell = row[i] ?? '';
            if (cell.length > max) max = cell.length;
        }
        return max;
    });

    const pad = (s: string, width: number) => s + ' '.repeat(Math.max(0, width - s.length));
    const headerLine = headers.map((h, i) => pad(h, colWidths[i])).join(' │ ');
    const dividerLine = colWidths.map(w => '─'.repeat(w)).join('─┼─');
    const dataLines = rows.map(row =>
        row.map((cell, i) => pad(cell ?? '', colWidths[i])).join(' │ ')
    );

    const tableText = [headerLine, dividerLine, ...dataLines].join('\n');
    return <Text style={style.inlineTableText}>{'\n'}{tableText}</Text>;
}

function RenderTextBlock(props: { spans: MarkdownSpan[], first: boolean, last: boolean, selectable: boolean }) {
    return <Text selectable={props.selectable} style={[style.text, props.first && style.first, props.last && style.last]}><RenderSpans spans={props.spans} baseStyle={style.text} /></Text>;
}

function RenderHeaderBlock(props: { level: 1 | 2 | 3 | 4 | 5 | 6, spans: MarkdownSpan[], first: boolean, last: boolean, selectable: boolean }) {
    const s = (style as any)[`header${props.level}`];
    const headerStyle = [style.header, s, props.first && style.first, props.last && style.last];
    return <Text selectable={props.selectable} style={headerStyle}><RenderSpans spans={props.spans} baseStyle={headerStyle} /></Text>;
}

function RenderListBlock(props: { items: MarkdownSpan[][], first: boolean, last: boolean, selectable: boolean }) {
    const listStyle = [style.text, style.list];
    return (
        <View style={{ flexDirection: 'column', marginBottom: 8, gap: 1 }}>
            {props.items.map((item, index) => (
                <Text selectable={props.selectable} style={listStyle} key={index}>- <RenderSpans spans={item} baseStyle={listStyle} /></Text>
            ))}
        </View>
    );
}

function RenderNumberedListBlock(props: { items: { number: number, spans: MarkdownSpan[] }[], first: boolean, last: boolean, selectable: boolean }) {
    const listStyle = [style.text, style.list];
    return (
        <View style={{ flexDirection: 'column', marginBottom: 8, gap: 1 }}>
            {props.items.map((item, index) => (
                <Text selectable={props.selectable} style={listStyle} key={index}>{item.number.toString()}. <RenderSpans spans={item.spans} baseStyle={listStyle} /></Text>
            ))}
        </View>
    );
}

function RenderCodeBlock(props: { content: string, language: string | null, first: boolean, last: boolean, selectable: boolean }) {
    const [isHovered, setIsHovered] = React.useState(false);

    const copyCode = React.useCallback(async () => {
        try {
            await Clipboard.setStringAsync(props.content);
            Modal.alert(t('common.success'), t('markdown.codeCopied'), [{ text: t('common.ok'), style: 'cancel' }]);
        } catch (error) {
            console.error('Failed to copy code:', error);
            Modal.alert(t('common.error'), t('markdown.copyFailed'), [{ text: t('common.ok'), style: 'cancel' }]);
        }
    }, [props.content]);

    return (
        <View
            style={[style.codeBlock, props.first && style.first, props.last && style.last]}
            // @ts-ignore - Web only events
            onMouseEnter={() => setIsHovered(true)}
            // @ts-ignore - Web only events
            onMouseLeave={() => setIsHovered(false)}
        >
            {props.language && <Text selectable={props.selectable} style={style.codeLanguage}>{props.language}</Text>}
            <ScrollView
                style={{ flexGrow: 0, flexShrink: 0 }}
                horizontal={true}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
                showsHorizontalScrollIndicator={false}
            >
                <SimpleSyntaxHighlighter
                    code={props.content}
                    language={props.language}
                    selectable={props.selectable}
                />
            </ScrollView>
            <View
                style={[style.copyButtonWrapper, isHovered && style.copyButtonWrapperVisible]}
                {...(Platform.OS === 'web' ? ({ className: 'copy-button-wrapper' } as any) : {})}
            >
                <Pressable
                    style={style.copyButton}
                    onPress={copyCode}
                >
                    <Text style={style.copyButtonText}>{t('common.copy')}</Text>
                </Pressable>
            </View>
        </View>
    );
}

function RenderOptionsBlock(props: { 
    items: string[], 
    first: boolean, 
    last: boolean, 
    selectable: boolean,
    onOptionPress?: (option: Option) => void 
}) {
    return (
        <View style={[style.optionsContainer, props.first && style.first, props.last && style.last]}>
            {props.items.map((item, index) => {
                if (props.onOptionPress) {
                    return (
                        <Pressable 
                            key={index} 
                            style={({ pressed }) => [
                                style.optionItem,
                                pressed && style.optionItemPressed
                            ]}
                            onPress={() => props.onOptionPress?.({ title: item })}
                        >
                            <Text selectable={props.selectable} style={style.optionText}>{item}</Text>
                        </Pressable>
                    );
                } else {
                    return (
                        <View key={index} style={style.optionItem}>
                            <Text selectable={props.selectable} style={style.optionText}>{item}</Text>
                        </View>
                    );
                }
            })}
        </View>
    );
}

function RenderSpans(props: { spans: MarkdownSpan[], baseStyle?: any }) {
    return (<>
        {props.spans.map((span, index) => {
            if (span.url) {
                return <Link key={index} href={span.url as any} target="_blank" style={[style.link, span.styles.map(s => style[s])]}>{span.text}</Link>
            } else {
                return <Text key={index} selectable style={[props.baseStyle, span.styles.map(s => style[s])]}>{span.text}</Text>
            }
        })}
    </>)
}

// Table rendering uses column-first layout to ensure consistent column widths.
// Each column is rendered as a vertical container with all its cells (header + data).
// This ensures that cells in the same column have the same width, determined by the widest content.
function RenderTableBlock(props: {
    headers: string[],
    rows: string[][],
    first: boolean,
    last: boolean
}) {
    const columnCount = props.headers.length;
    const rowCount = props.rows.length;
    const isLastRow = (rowIndex: number) => rowIndex === rowCount - 1;

    return (
        <View style={[style.tableContainer, props.first && style.first, props.last && style.last]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={Platform.OS !== 'web'}
                nestedScrollEnabled={true}
                style={style.tableScrollView}
            >
                <View style={style.tableContent}>
                    {/* Render each column as a vertical container */}
                    {props.headers.map((header, colIndex) => (
                        <View
                            key={`column-${colIndex}`}
                            style={[
                                style.tableColumn,
                                colIndex === columnCount - 1 && style.tableColumnLast
                            ]}
                        >
                            {/* Header cell for this column */}
                            <View style={[style.tableCell, style.tableHeaderCell, style.tableCellFirst]}>
                                <Text style={style.tableHeaderText}>{header}</Text>
                            </View>
                            {/* Data cells for this column */}
                            {props.rows.map((row, rowIndex) => (
                                <View
                                    key={`cell-${rowIndex}-${colIndex}`}
                                    style={[
                                        style.tableCell,
                                        isLastRow(rowIndex) && style.tableCellLast
                                    ]}
                                >
                                    <Text style={style.tableCellText}>{row[colIndex] ?? ''}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}


const style = StyleSheet.create((theme) => ({

    // Plain text

    text: {
        ...Typography.default(),
        fontSize: 16,
        lineHeight: 24, // Reduced from 28 to 24
        marginTop: 8,
        marginBottom: 8,
        color: theme.colors.text,
        fontWeight: '400',
    },

    italic: {
        fontStyle: 'italic',
    },
    bold: {
        fontWeight: 'bold',
    },
    semibold: {
        fontWeight: '600',
    },
    code: {
        ...Typography.mono(),
        fontSize: 16,
        lineHeight: 21,  // Reduced from 24 to 21
        backgroundColor: theme.colors.surfaceHighest,
        color: theme.colors.text,
    },
    link: {
        ...Typography.default(),
        color: theme.colors.textLink,
        fontWeight: '400',
    },

    // Headers

    header: {
        ...Typography.default('semiBold'),
        color: theme.colors.text,
    },
    header1: {
        fontSize: 16,
        lineHeight: 24,  // Reduced from 36 to 24
        fontWeight: '900',
        marginTop: 16,
        marginBottom: 8
    },
    header2: {
        fontSize: 20,
        lineHeight: 24,  // Reduced from 36 to 32
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8
    },
    header3: {
        fontSize: 16,
        lineHeight: 28,  // Reduced from 32 to 28
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    header4: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 8,
    },
    header5: {
        fontSize: 16,
        lineHeight: 24,  // Reduced from 28 to 24
        fontWeight: '600'
    },
    header6: {
        fontSize: 16,
        lineHeight: 24, // Reduced from 28 to 24
        fontWeight: '600'
    },

    //
    // List
    //

    list: {
        ...Typography.default(),
        color: theme.colors.text,
        marginTop: 0,
        marginBottom: 0,
    },

    //
    // Common
    //

    first: {
        // marginTop: 0
    },
    last: {
        // marginBottom: 0
    },

    //
    // Code Block
    //

    codeBlock: {
        backgroundColor: theme.colors.surfaceHighest,
        borderRadius: 8,
        marginVertical: 8,
        position: 'relative',
        zIndex: 1,
    },
    copyButtonWrapper: {
        position: 'absolute',
        top: 8,
        right: 8,
        opacity: 0,
        zIndex: 10,
        elevation: 10,
        pointerEvents: 'none',
    },
    copyButtonWrapperVisible: {
        opacity: 1,
        pointerEvents: 'auto',
    },
    codeLanguage: {
        ...Typography.mono(),
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 8,
        paddingHorizontal: 16,
        marginBottom: 0,
    },
    codeText: {
        ...Typography.mono(),
        color: theme.colors.text,
        fontSize: 14,
        lineHeight: 20,
    },
    horizontalRule: {
        height: 1,
        backgroundColor: theme.colors.divider,
        marginTop: 8,
        marginBottom: 8,
    },
    copyButtonContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        elevation: 10,
        opacity: 1,
    },
    copyButtonContainerHidden: {
        opacity: 0,
    },
    copyButton: {
        backgroundColor: theme.colors.surfaceHighest,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        cursor: 'pointer',
    },
    copyButtonHidden: {
        display: 'none',
    },
    copyButtonCopied: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
        opacity: 1,
    },
    copyButtonText: {
        ...Typography.default(),
        color: theme.colors.text,
        fontSize: 12,
        lineHeight: 16,
    },

    //
    // Options Block
    //

    optionsContainer: {
        flexDirection: 'column',
        gap: 8,
        marginVertical: 8,
    },
    optionItem: {
        backgroundColor: theme.colors.surfaceHighest,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    optionItemPressed: {
        opacity: 0.7,
        backgroundColor: theme.colors.surfaceHigh,
    },
    optionText: {
        ...Typography.default(),
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.text,
    },

    //
    // Table
    //

    tableContainer: {
        marginVertical: 8,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        borderRadius: 8,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    tableScrollView: {
        flexGrow: 0,
    },
    tableContent: {
        flexDirection: 'row',
    },
    tableColumn: {
        flexDirection: 'column',
        borderRightWidth: 1,
        borderRightColor: theme.colors.divider,
    },
    tableColumnLast: {
        borderRightWidth: 0,
    },
    tableCell: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        alignItems: 'flex-start',
    },
    tableCellFirst: {
        borderTopWidth: 0,
    },
    tableCellLast: {
        borderBottomWidth: 0,
    },
    tableHeaderCell: {
        backgroundColor: theme.colors.surfaceHigh,
    },
    tableHeaderText: {
        ...Typography.default('semiBold'),
        color: theme.colors.text,
        fontSize: 16,
        lineHeight: 24,
    },
    tableCellText: {
        ...Typography.default(),
        color: theme.colors.text,
        fontSize: 16,
        lineHeight: 24,
    },

    // Inline mode styles (single Text wrapper for cross-block selection)

    inlineGroup: {
        ...Typography.default(),
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.text,
        fontWeight: '400',
    },
    inlineText: {
        ...Typography.default(),
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.text,
        fontWeight: '400',
    },
    inlineCode: {
        ...Typography.mono(),
        fontSize: 14,
        lineHeight: 20,
        backgroundColor: theme.colors.surfaceHighest,
        color: theme.colors.text,
    },
    inlineCodeLanguage: {
        ...Typography.mono(),
        fontSize: 12,
        lineHeight: 16,
        color: theme.colors.textSecondary,
    },
    inlineHorizontalRule: {
        ...Typography.default(),
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.divider,
    },
    inlineTableText: {
        ...Typography.mono(),
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.text,
    },

    // Add global style for Web platform (Unistyles supports this via compiler plugin)
    ...(Platform.OS === 'web' ? {
        // Web-only CSS styles
        _____web_global_styles: {}
    } : {}),
}));