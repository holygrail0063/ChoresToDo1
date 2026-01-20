import './HandDivider.css';

export default function HandDivider() {
  // Use inline SVG to avoid build issues with public assets
  const svgPath = "M0,8 Q18,4 35,8 Q52,12 70,8 Q88,4 105,8 Q122,12 140,8 Q158,4 175,8 Q192,12 210,8 Q228,4 245,8 Q262,12 280,8 Q298,4 315,8 Q332,12 350,8 Q368,4 385,8 Q400,12 400,8";
  const svgPathSecondary = "M0,8 Q22,5 45,8 Q67,11 90,8 Q112,5 135,8 Q157,11 180,8 Q202,5 225,8 Q247,11 270,8 Q292,5 315,8 Q337,11 360,8 Q382,5 400,8";
  
  return (
    <div className="hand-divider" aria-hidden="true">
      <svg 
        width="100%" 
        height="16" 
        viewBox="0 0 400 16" 
        preserveAspectRatio="none" 
        style={{ display: 'block', width: '100%', height: '16px' }}
      >
        <path 
          d={svgPath}
          stroke="currentColor"
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path 
          d={svgPathSecondary}
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

