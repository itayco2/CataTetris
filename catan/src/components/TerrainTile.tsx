import { TerrainType } from './GameBoard';

interface TerrainTileProps {
  x: number;
  y: number;
  terrain?: TerrainType;
  hasSettlement?: boolean;
  hasCity?: boolean;
  number?: number;
  onClick?: () => void;
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

export const TerrainTile = ({ 
  x, 
  y, 
  terrain, 
  hasSettlement, 
  hasCity, 
  number,
  onClick 
}: TerrainTileProps) => {
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

  // Determine number color based on probability
  const getNumberColor = (num: number) => {
    if (num === 6 || num === 8) return '#dc2626'; // Red for high probability
    if (num === 5 || num === 9) return '#ea580c'; // Orange
    if (num === 4 || num === 10) return '#ca8a04'; // Yellow
    return '#1e293b'; // Dark for low probability
  };

  return (
    <g className="transition-all duration-300 hover:scale-105 cursor-pointer" onClick={onClick}>
      {/* Drop shadow for depth */}
      <path
        d={hexPath()}
        fill="black"
        opacity="0.2"
        transform="translate(2, 2)"
      />
      
      {/* Hex background */}
      <path
        d={hexPath()}
        fill={terrain ? TERRAIN_COLORS[terrain] : '#1a2f4a'}
        stroke={terrain ? '#4a3a28' : '#2a4a6a'}
        strokeWidth="2"
        opacity={terrain ? 1 : 0.2}
        className="transition-all duration-300"
      />
      
      {/* Inner highlight for 3D effect */}
      {terrain && (
        <path
          d={hexPath()}
          fill="url(#hex-gradient)"
          opacity="0.3"
        />
      )}
      
      {/* Terrain pattern/icon */}
      {terrain && (
        <text
          x={x}
          y={y - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="16"
          className="pointer-events-none select-none filter drop-shadow-sm"
        >
          {TERRAIN_PATTERNS[terrain]}
        </text>
      )}
      
      {/* Number token */}
      {number && terrain !== 'desert' && terrain !== 'water' && (
        <g>
          <circle
            cx={x}
            cy={y + 10}
            r="12"
            fill="#fef3c7"
            stroke="#92400e"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          <text
            x={x}
            y={y + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="bold"
            fill={getNumberColor(number)}
            className="pointer-events-none select-none"
          >
            {number}
          </text>
          {/* Probability dots */}
          <text
            x={x}
            y={y + 20}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="#92400e"
            className="pointer-events-none select-none"
          >
            {number === 6 || number === 8 ? '•••••' : 
             number === 5 || number === 9 ? '••••' :
             number === 4 || number === 10 ? '•••' :
             number === 3 || number === 11 ? '••' : '•'}
          </text>
        </g>
      )}
      
      {/* Settlement */}
      {hasSettlement && (
        <g transform={`translate(${x}, ${y - 10})`}>
          <polygon
            points="0,-6 -5,3 5,3"
            fill="#e74c3c"
            stroke="#c0392b"
            strokeWidth="1"
          />
          <rect
            x="-4"
            y="3"
            width="8"
            height="6"
            fill="#e74c3c"
            stroke="#c0392b"
            strokeWidth="1"
          />
        </g>
      )}
      
      {/* City */}
      {hasCity && (
        <g transform={`translate(${x}, ${y - 10})`}>
          <rect
            x="-6"
            y="-2"
            width="12"
            height="8"
            fill="#3498db"
            stroke="#2980b9"
            strokeWidth="1"
          />
          <polygon
            points="-6,-2 -6,-8 0,-12 6,-8 6,-2"
            fill="#3498db"
            stroke="#2980b9"
            strokeWidth="1"
          />
        </g>
      )}
      
      {/* Hover effect */}
      {!terrain && (
        <path
          d={hexPath()}
          fill="rgba(255, 255, 255, 0.1)"
          opacity="0"
          className="transition-opacity duration-200 hover:opacity-100"
        />
      )}
    </g>
  );
};