import { TerrainType } from './GameBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface NextTilePreviewProps {
  nextTile: TerrainType | null;
  upcomingTiles: TerrainType[];
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

const TERRAIN_NAMES = {
  forest: 'Forest',
  field: 'Field',
  mountain: 'Mountain',
  pasture: 'Pasture',
  hill: 'Hill',
  desert: 'Desert',
  water: 'Water',
  gold: 'Gold'
};

export const NextTilePreview = ({ nextTile, upcomingTiles }: NextTilePreviewProps) => {
  const isMobile = useIsMobile();
  
  const renderMiniHex = (terrain: TerrainType, size: number = 20) => {
    const hexPath = () => {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6; // Flat-top hex
        const pointX = size * Math.cos(angle);
        const pointY = size * Math.sin(angle);
        points.push(`${pointX},${pointY}`);
      }
      return `M ${points.join(' L ')} Z`;
    };

    return (
      <svg 
        width={size * 2.2} 
        height={size * 2.2} 
        viewBox={`-${size * 1.1} -${size * 1.1} ${size * 2.2} ${size * 2.2}`}
        className="mx-auto"
      >
        <path
          d={hexPath()}
          fill={TERRAIN_COLORS[terrain]}
          stroke="#4a3a28"
          strokeWidth="1.5"
        />
        <text
          x={0}
          y={2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.6}
          fill="white"
          stroke="black"
          strokeWidth="0.3"
          className="pointer-events-none select-none"
        >
          {TERRAIN_PATTERNS[terrain]}
        </text>
      </svg>
    );
  };

  // Mobile compact view
  if (isMobile) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-medieval">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">Next:</div>
            <div className="flex items-center gap-2">
              {/* Current/Next Tile */}
              {nextTile && (
                <div className="flex items-center gap-1">
                  {renderMiniHex(nextTile, 15)}
                  <span className="text-xs font-medium text-foreground">
                    {TERRAIN_NAMES[nextTile]}
                  </span>
                </div>
              )}
              
              {/* Divider */}
              {nextTile && upcomingTiles.length > 0 && (
                <div className="w-px h-8 bg-border/50" />
              )}
              
              {/* Upcoming Tiles */}
              {upcomingTiles.length > 0 && (
                <div className="flex gap-1">
                  {upcomingTiles.slice(0, 2).map((terrain, index) => (
                    <div key={index} className="opacity-60">
                      {renderMiniHex(terrain, 12)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop view
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-medieval">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-center text-primary">Next Tiles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Next Tile */}
        {nextTile && (
          <div className="text-center">
            <div className="mb-2">
              {renderMiniHex(nextTile, 25)}
            </div>
            <div className="text-sm font-medium text-foreground">
              {TERRAIN_NAMES[nextTile]}
            </div>
          </div>
        )}
        
        {/* Upcoming Tiles Preview */}
        {upcomingTiles.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground text-center mb-2">Upcoming:</div>
            <div className="flex justify-center gap-1">
              {upcomingTiles.slice(0, 3).map((terrain, index) => (
                <div key={index} className="opacity-75">
                  {renderMiniHex(terrain, 15)}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};