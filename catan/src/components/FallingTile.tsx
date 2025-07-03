import { TerrainType } from './GameBoard';

interface FallingTileProps {
  x: number;
  y: number;
  terrain: TerrainType;
  rotation: number;
}

const TERRAIN_COLORS = {
  forest: '#228B22',    // Forest Green - Wood
  field: '#F4A460',     // Sandy Brown - Wheat  
  mountain: '#696969',  // Dim Gray - Ore
  pasture: '#90EE90',   // Light Green - Sheep
  hill: '#A0522D',      // Sienna - Brick
  desert: '#F5DEB3',    // Wheat (pale) - Desert
  water: '#4682B4',     // Steel Blue - Sea
  gold: '#FFD700'       // Gold
};

const TERRAIN_PATTERNS = {
  forest: '🌲',
  field: '🌾',
  mountain: '⛏️',
  pasture: '🐑',
  hill: '🧱',
  desert: '🏜️',
  water: '🌊',
  gold: '💰'
};

export const FallingTile = ({ x, y, terrain, rotation }: FallingTileProps) => {
  const hexSize = 30;
  
  // Generate hexagon path
  const hexPath = () => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6; // Rotate for flat-top hex
      const pointX = x + hexSize * Math.cos(angle);
      const pointY = y + hexSize * Math.sin(angle);
      points.push(`${pointX},${pointY}`);
    }
    return `M ${points.join(' L ')} Z`;
  };

  return (
    <g 
      className="animate-bounce"
      style={{ 
        transform: `rotate(${rotation}deg)`,
        transformOrigin: `${x}px ${y}px`,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      {/* Drop shadow for floating effect */}
      <path
        d={hexPath()}
        fill="black"
        opacity="0.3"
        transform="translate(3, 3)"
        className="animate-pulse"
      />
      
      {/* Glowing outline for falling tile */}
      <path
        d={hexPath()}
        fill="none"
        stroke="#ffd700"
        strokeWidth="4"
        opacity="0.9"
        filter="url(#glow)"
      />
      
      {/* Define glow filter */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Hex background */}
      <path
        d={hexPath()}
        fill={TERRAIN_COLORS[terrain]}
        stroke="#4a3a28"
        strokeWidth="2"
        className="drop-shadow-lg"
      />
      
      {/* Terrain pattern/icon */}
      <text
        x={x}
        y={y + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="18"
        className="pointer-events-none select-none filter drop-shadow-md"
        fill="white"
        stroke="black"
        strokeWidth="0.5"
      >
        {TERRAIN_PATTERNS[terrain]}
      </text>
      
      {/* Preview placement indicator */}
      <circle
        cx={x}
        cy={y}
        r="35"
        fill="none"
        stroke="rgba(255, 215, 0, 0.3)"
        strokeWidth="2"
        className="animate-ping"
      />
    </g>
  );
};