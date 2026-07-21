import Svg, { Circle, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function SearchIcon({ size = 20, color = '#444' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="40" cy="40" r="28" stroke={color} strokeWidth="10" fill="none" />
      <Line x1="61" y1="61" x2="88" y2="88" stroke={color} strokeWidth="10" strokeLinecap="round" />
    </Svg>
  );
}
