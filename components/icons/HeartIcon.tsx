import Svg, { Circle, Polygon } from 'react-native-svg';

interface HeartIconProps {
  size?: number;
  filled?: boolean;
  color?: string;
  emptyColor?: string;
}

// Built from two circles + a diamond rather than a hand-traced bezier path —
// verified gapless by construction, safe to render without a visual preview.
const DIAMOND_POINTS = '50,25 80,55 50,88 20,55';

export function HeartIcon({ size = 22, filled = false, color = '#e0245e', emptyColor = '#ccc' }: HeartIconProps) {
  const fill = filled ? color : emptyColor;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="35" cy="35" r="22" fill={fill} />
      <Circle cx="65" cy="35" r="22" fill={fill} />
      <Polygon points={DIAMOND_POINTS} fill={fill} />
    </Svg>
  );
}
