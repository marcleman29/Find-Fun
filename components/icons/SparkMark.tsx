import { useId } from 'react';
import Svg, { Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';

// The app's signature mark — a 4-point spark/star, used everywhere in place
// of stock emoji (app icon, header, sign-in screen, card banners) so the
// brand reads as one deliberate shape instead of borrowed glyphs.
const SPARK_POINTS = '50,8 61.31,38.69 92,50 61.31,61.31 50,92 38.69,61.31 8,50 38.69,38.69';

interface SparkMarkProps {
  size?: number;
  color?: string;
  gradient?: [string, string];
}

export function SparkMark({ size = 32, color = '#fff', gradient }: SparkMarkProps) {
  const gradientId = useId();

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {gradient && (
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradient[0]} />
            <Stop offset="1" stopColor={gradient[1]} />
          </LinearGradient>
        </Defs>
      )}
      <Polygon points={SPARK_POINTS} fill={gradient ? `url(#${gradientId})` : color} />
    </Svg>
  );
}
