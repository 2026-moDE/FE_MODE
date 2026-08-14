import React from 'react';
import {Dimensions, StyleSheet, Text, View} from 'react-native';

import {colors} from '../../constants/colors';
import {fontFamily} from '../../constants/typography';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Block =
  | {type: 'heading'; text: string}
  | {type: 'bullet'; text: string}
  | {type: 'paragraph'; text: string}
  | {type: 'table'; header: string[]; rows: string[][]};

const isTableSeparatorLine = (line: string) => /^\|[\s-:|]+\|$/.test(line);

const parseTableLine = (line: string) =>
  line
    .split('|')
    .slice(1, -1)
    .map(cell => cell.trim());

// termsMock의 body는 "### 제조" / "- 항목" / "| 표 |" 마크다운 표기를 사용합니다.
function parseBody(raw: string): Block[] {
  const lines = raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('|')) {
      const tableLines: string[] = [];

      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i += 1;
      }

      const [header, ...rows] = tableLines
        .filter(tableLine => !isTableSeparatorLine(tableLine))
        .map(parseTableLine);

      blocks.push({type: 'table', header, rows});
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({type: 'heading', text: line.slice(4)});
    } else if (line.startsWith('- ')) {
      blocks.push({type: 'bullet', text: line.slice(2)});
    } else {
      blocks.push({type: 'paragraph', text: line});
    }

    i += 1;
  }

  return blocks;
}

type Props = {
  text: string;
};

export default function TermsBodyText({text}: Props) {
  const blocks = parseBody(text);

  return (
    <View style={styles.box}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text
              key={index}
              style={[styles.heading, index > 0 && styles.headingSpacing]}>
              {block.text}
            </Text>
          );
        }

        if (block.type === 'bullet') {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{block.text}</Text>
            </View>
          );
        }

        if (block.type === 'table') {
          return (
            <View key={index} style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                {block.header.map((cell, cellIndex) => (
                  <View
                    key={cellIndex}
                    style={[
                      styles.tableCell,
                      cellIndex > 0 && styles.tableCellBorderLeft,
                    ]}>
                    <Text style={styles.tableHeaderText}>{cell}</Text>
                  </View>
                ))}
              </View>

              {block.rows.map((row, rowIndex) => (
                <View
                  key={rowIndex}
                  style={[styles.tableRow, styles.tableRowBorderTop]}>
                  {row.map((cell, cellIndex) => (
                    <View
                      key={cellIndex}
                      style={[
                        styles.tableCell,
                        cellIndex > 0 && styles.tableCellBorderLeft,
                      ]}>
                      <Text style={styles.tableCellText}>{cell}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        }

        return (
          <Text key={index} style={styles.paragraph}>
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: px(radius.sm),
    overflow: 'hidden',
    marginBottom: px(4),
  },

  tableRow: {
    flexDirection: 'row',
  },

  tableHeaderRow: {
    backgroundColor: colors.surface.default,
  },

  tableRowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },

  tableCell: {
    flex: 1,
    paddingVertical: px(8),
    paddingHorizontal: px(8),
  },

  tableCellBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border.default,
  },

  tableHeaderText: {
    fontFamily: fontFamily.bold,
    fontSize: px(11.5),
    lineHeight: px(16),
    color: colors.text.basic,
  },

  tableCellText: {
    fontFamily: fontFamily.regular,
    fontSize: px(11.5),
    lineHeight: px(16),
    color: colors.text.tertiary,
  },

  box: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: px(radius.md),
    padding: px(spacing.md),
  },

  heading: {
    fontFamily: fontFamily.bold,
    fontSize: px(13),
    lineHeight: px(19),
    color: colors.text.basic,
    marginBottom: px(4),
  },

  headingSpacing: {
    marginTop: px(12),
  },

  paragraph: {
    fontFamily: fontFamily.regular,
    fontSize: px(12.5),
    lineHeight: px(19),
    color: colors.text.tertiary,
    marginBottom: px(4),
  },

  bulletRow: {
    flexDirection: 'row',
    marginBottom: px(2),
  },

  bulletDot: {
    fontFamily: fontFamily.regular,
    fontSize: px(12.5),
    lineHeight: px(19),
    color: colors.text.tertiary,
    width: px(14),
  },

  bulletText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: px(12.5),
    lineHeight: px(19),
    color: colors.text.tertiary,
  },
});
