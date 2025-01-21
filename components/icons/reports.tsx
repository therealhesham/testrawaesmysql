import * as React from "react";

interface ReportsIconProps extends React.SVGProps<SVGSVGElement> {
  fill?: string;
  width?: string | number;
  height?: string | number;
}

const ReportsIcon: React.FC<ReportsIconProps> = ({
  fill = "white", // Default fill color
  width = 32, // Default width
  height = 32, // Default height
  ...rest
}) => {
  return (
    <svg
      fill={fill}
      width={width}
      height={height}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Report Icon"
      role="img" // Added role for better accessibility
      {...rest}
    >
      <title>Report Icon</title>
      <rect x="10" y="18" width="8" height="2" />
      <rect x="10" y="13" width="12" height="2" />
      <rect x="10" y="23" width="5" height="2" />
      <path  d="M25,5H22V4a2,2,0,0,0-2-2H12a2,2,0,0,0-2,2V5H7A2,2,0,0,0,5,7V28a2,2,0,0,0,2,2H25a2,2,0,0,0,2-2V7A2,2,0,0,0,25,5ZM12,4h8V8H12ZM25,28H7V7h3v3H22V7h3Z" />
    </svg>
  );
};

export default ReportsIcon;
