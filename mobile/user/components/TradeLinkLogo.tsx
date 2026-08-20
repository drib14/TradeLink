import React from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G,
} from 'react-native-svg';

interface TradeLinkLogoProps {
  size?: number;
  borderRadius?: number;
}

export const TradeLinkLogo: React.FC<TradeLinkLogoProps> = ({
  size = 40,
  borderRadius,
}) => {
  const rx = borderRadius !== undefined ? (borderRadius / size) * 512 : 128;

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
        <Defs>
          {/* UC Royal Navy Background Gradient */}
          <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0A369D" />
            <Stop offset="60%" stopColor="#002B7F" />
            <Stop offset="100%" stopColor="#00184A" />
          </LinearGradient>

          {/* Radiant Gold Gradient */}
          <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFE066" />
            <Stop offset="50%" stopColor="#FFC72C" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>

          {/* Crisp White Gradient */}
          <LinearGradient id="whiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F8FAFC" />
          </LinearGradient>
        </Defs>

        {/* Modern Squircle App Icon Container */}
        <Rect width="512" height="512" rx={rx} fill="url(#bgGrad)" />
        <Rect
          width="506"
          height="506"
          x="3"
          y="3"
          rx={rx - 3}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="2.5"
        />

        {/* Clean Bold Flat "tl" Lettermark Mark */}
        <G>
          {/* Crisp White 't' */}
          <Path
            d="M 186 155 C 186 140 198 128 213 128 C 228 128 240 140 240 155 L 240 195 L 268 195 C 283 195 295 207 295 222 C 295 237 283 249 268 249 L 240 249 L 240 325 C 240 348 252 362 272 362 C 284 362 294 357 302 350 C 313 340 330 340 340 350 C 350 360 350 377 340 387 C 322 403 300 412 272 412 C 222 412 186 376 186 325 L 186 249 L 158 249 C 143 249 131 237 131 222 C 131 207 143 195 158 195 L 186 195 Z"
            fill="url(#whiteGrad)"
          />

          {/* Radiant Gold 'l' */}
          <Path
            d="M 352 108 C 367 108 379 120 379 135 L 379 385 C 379 400 367 412 352 412 C 337 412 325 400 325 385 L 325 135 C 325 120 337 108 352 108 Z"
            fill="url(#goldGrad)"
          />

          {/* Radiant Gold Nexus Dot - Perfectly Centered Between t and l */}
          <Circle cx="282.5" cy="150" r="22" fill="url(#goldGrad)" />
        </G>
      </Svg>
    </View>
  );
};
