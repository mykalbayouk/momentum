import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

interface BoxingIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function BoxingIcon({ width = 24, height = 24, color = 'white' }: BoxingIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#clip0_2001_708)">
        <Path
          d="M3.32001 8.99999C3.60023 8.56389 3.99922 8.21693 4.47001 7.99999C4.81146 7.79973 5.19317 7.67789 5.5875 7.6433C5.98183 7.60871 6.37891 7.66223 6.75001 7.79999C7.05529 7.93637 7.31324 8.16024 7.49125 8.44327C7.66926 8.7263 7.75931 9.05577 7.75001 9.38999C8.56837 9.50924 9.31082 9.93506 9.82699 10.5812C10.3432 11.2273 10.5945 12.0455 10.53 12.87C10.5662 13.3423 10.4996 13.8169 10.3348 14.261C10.1701 14.7052 9.91104 15.1084 9.57559 15.4429C9.24015 15.7774 8.83623 16.0352 8.39161 16.1987C7.947 16.3622 7.47225 16.4275 7.00001 16.39C5.33001 16.39 3.89001 16.39 3.24001 14.99C2.97252 14.3129 2.84989 13.5873 2.88001 12.86V12.78V10.44C2.88771 9.92807 3.04027 9.42879 3.32001 8.99999Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M0.409973 10.01V13.99"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M21.09 10.44V12.78V12.86C21.1215 13.5907 20.9989 14.3198 20.73 15C20.08 16.4 18.64 16.4 16.97 16.4C16.5033 16.4256 16.0365 16.3512 15.6009 16.1818C15.1654 16.0124 14.771 15.7518 14.4443 15.4175C14.1176 15.0833 13.8662 14.683 13.7068 14.2437C13.5473 13.8043 13.4837 13.336 13.52 12.87C13.4529 12.0439 13.703 11.2232 14.2194 10.5749C14.7358 9.92658 15.4798 9.49932 16.3 9.38C16.2864 9.05126 16.369 8.72571 16.5378 8.44326C16.7065 8.16082 16.9541 7.93378 17.25 7.79C17.6211 7.65224 18.0182 7.59872 18.4125 7.63331C18.8068 7.6679 19.1885 7.78973 19.53 7.99C19.9957 8.20825 20.3897 8.55452 20.6659 8.98836C20.9422 9.42219 21.0892 9.92568 21.09 10.44Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M23.59 10.01V13.99"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2001_708">
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
} 