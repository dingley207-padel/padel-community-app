import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface CancelIconProps {
  size?: number;
  color?: string;
}

export default function CancelIcon({ size = 24, color = '#FF0000' }: CancelIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Rounded square outline */}
      <Rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="4"
        ry="4"
        stroke={color}
        strokeWidth="1"
        fill="none"
      />
      {/* X mark - first line */}
      <Path
        d="M8 8L16 16"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* X mark - second line */}
      <Path
        d="M16 8L8 16"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </Svg>
  );
}
