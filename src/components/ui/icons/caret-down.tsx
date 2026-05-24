import type { SvgProps } from "react-native-svg";
import * as React from "react";
import Svg, { Path } from "react-native-svg";

export function CaretDown({ color = "#000", ...props }: SvgProps) {
  return (
    <Svg width={12} height={13} viewBox="0 0 12 13" fill="none" {...props}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        stroke={color}
        d="M9.75 4.744 6 8.494l-3.75-3.75"
      />
    </Svg>
  );
}
