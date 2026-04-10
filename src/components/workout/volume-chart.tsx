import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

import { DarkTheme } from '@/constants/theme';
import type { VolumeData } from '@/types/workout';

interface Props {
  data: VolumeData[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function VolumeChart({ data }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - 40; // 20px padding each side
  const chartHeight = 200;

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height: chartHeight }]}>
        <Text style={styles.emptyText}>데이터가 없습니다</Text>
      </View>
    );
  }

  const maxVolume = Math.max(...data.map((d) => d.volume), 1);
  const paddingLeft = 40;
  const paddingBottom = 24;
  const paddingTop = 8;
  const drawWidth = chartWidth - paddingLeft;
  const drawHeight = chartHeight - paddingBottom - paddingTop;
  const barWidth = Math.min(
    (drawWidth / data.length) * 0.6,
    32,
  );
  const gap = drawWidth / data.length;

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {/* Y axis lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = paddingTop + drawHeight * (1 - ratio);
        return (
          <React.Fragment key={ratio}>
            <Line
              x1={paddingLeft}
              x2={chartWidth}
              y1={y}
              y2={y}
              stroke={DarkTheme.bgBorder}
              strokeWidth={1}
            />
            <SvgText
              x={paddingLeft - 4}
              y={y + 4}
              fill={DarkTheme.textTertiary}
              fontSize={10}
              textAnchor="end"
            >
              {Math.round(maxVolume * ratio)}
            </SvgText>
          </React.Fragment>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const barHeight = (d.volume / maxVolume) * drawHeight;
        const x = paddingLeft + i * gap + (gap - barWidth) / 2;
        const y = paddingTop + drawHeight - barHeight;
        return (
          <React.Fragment key={d.date}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={DarkTheme.accentCyan}
              opacity={0.8}
            />
            <SvgText
              x={x + barWidth / 2}
              y={chartHeight - 4}
              fill={DarkTheme.textTertiary}
              fontSize={10}
              textAnchor="middle"
            >
              {formatDate(d.date)}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: DarkTheme.textTertiary,
    fontSize: 14,
  },
});
