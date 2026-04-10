import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';

import { DarkTheme } from '@/constants/theme';

interface MiniChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function MiniChart({ data, color, width = 280, height = 70 }: MiniChartProps) {
  const strokeColor = color ?? DarkTheme.textPrimary;

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 8;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);
  const lastY = padding + (1 - (data[data.length - 1] - min) / range) * (height - padding * 2);

  return (
    <View>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={lastX} cy={lastY} r={4} fill={strokeColor} />
      </Svg>
    </View>
  );
}
