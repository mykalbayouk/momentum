import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

interface ScaleIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function ScaleIcon({ width = 24, height = 24, color = 'white' }: ScaleIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#clip0_2001_680)">
        <Path
          d="M22.48 5.28C22.48 4.7836 22.3822 4.29207 22.1923 3.83346C22.0023 3.37485 21.7239 2.95814 21.3729 2.60714C21.0219 2.25613 20.6052 1.9777 20.1466 1.78774C19.6879 1.59777 19.1964 1.5 18.7 1.5H5.26001C4.25749 1.5 3.29603 1.89825 2.58715 2.60714C1.87826 3.31602 1.48001 4.27748 1.48001 5.28V18.72C1.48001 19.7225 1.87826 20.684 2.58715 21.3929C3.29603 22.1018 4.25749 22.5 5.26001 22.5H18.7C19.7025 22.5 20.664 22.1018 21.3729 21.3929C22.0818 20.684 22.48 19.7225 22.48 18.72V5.28Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 11.05C10.8806 11.028 9.80841 10.5949 8.98776 9.83322C8.16711 9.07159 7.65535 8.03465 7.54999 6.92C7.54999 5.02 9.54999 4.16 11.98 4.16C14.41 4.16 16.4 5 16.4 6.92C16.2957 8.0263 15.7911 9.05646 14.9809 9.81695C14.1707 10.5774 13.1107 11.0159 12 11.05Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 8V6.76"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2001_680">
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
} 