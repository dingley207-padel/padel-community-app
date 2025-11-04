import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface AddProfileIconProps {
  size?: number;
  color?: string;
}

export const AddProfileIcon: React.FC<AddProfileIconProps> = ({
  size = 24,
  color = '#8FFE09'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Profile silhouette */}
      <Circle cx="12" cy="8" r="4" fill={color} />
      <Path
        d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Plus sign */}
      <Circle cx="18" cy="6" r="5" fill="white" stroke={color} strokeWidth="1.5" />
      <Path
        d="M18 4v4M16 6h4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};
