import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroIsland from '@/assets/hero-island.jpg';

export interface TileCount {
  field: number;
  forest: number;
  pasture: number;
  hill: number;
  mountain: number;
  desert: number;
  water: number;
  gold: number;
}

export interface GameMode {
  id: string;
  name: string;
  description: string;
  mapSize: number;
  maxPlayers: number;
  features: string[];
  tileCount: TileCount;
}

const GAME_MODES: GameMode[] = [
  {
    id: 'base-3-4',
    name: 'Base Game (3-4 Players)',
    description: 'The classic Catan island experience.',
    mapSize: 2, // Generates 19 land tiles
    maxPlayers: 4,
    features: ['19 Land Tiles', 'Balanced Resources', 'Classic Gameplay'],
    tileCount: { 
      field: 4,      // Wheat
      forest: 4,     // Wood
      pasture: 4,    // Sheep
      hill: 3,       // Brick
      mountain: 3,   // Ore
      desert: 1,     // Desert
      water: 0,      // No water tiles
      gold: 0 
    }
  },
  {
    id: 'base-5-6',
    name: 'Base Game (5-6 Players)',
    description: 'Extended island for more settlers.',
    mapSize: 3, // Generates 37 land tiles
    maxPlayers: 6,
    features: ['37 Land Tiles', 'Larger Island', 'More Resources'],
    tileCount: { 
      field: 8,      // Wheat
      forest: 8,     // Wood
      pasture: 7,    // Sheep
      hill: 6,       // Brick
      mountain: 6,   // Ore
      desert: 2,     // Desert
      water: 0,      // No water tiles
      gold: 0 
    }
  },
  {
    id: 'seafarers-islands',
    name: 'Seafarers: Island Hopping',
    description: 'Navigate between multiple islands across the sea.',
    mapSize: 3, // Reduced from 4 to 3 for better gameplay (37 tiles)
    maxPlayers: 4,
    features: ['Multiple Islands', 'Sea Routes', 'Gold Hexes', 'Ships'],
    tileCount: { 
      field: 4,      // Wheat
      forest: 4,     // Wood
      pasture: 4,    // Sheep
      hill: 3,       // Brick
      mountain: 3,   // Ore
      desert: 1,     // Desert
      water: 16,     // Water for islands
      gold: 2        // Gold fields
    }
  },
  {
    id: 'seafarers-large',
    name: 'Seafarers: New Shores (5-6)',
    description: 'Explore vast archipelagos with your fleet.',
    mapSize: 4,    // Large map for 5-6 players
    maxPlayers: 6,
    features: ['Massive Map', 'Naval Exploration', 'Gold Discovery', 'Trade Routes'],
    tileCount: { 
      field: 8,      // Wheat
      forest: 8,     // Wood
      pasture: 8,    // Sheep
      hill: 6,       // Brick
      mountain: 6,   // Ore
      desert: 2,     // Desert
      water: 20,     // Lots of water for sea routes
      gold: 3        // More gold for larger map
    }
  },
  {
    id: 'tetris-mode',
    name: 'Tetris Mode - Endless',
    description: 'Infinite tiles for endless building fun!',
    mapSize: 3,
    maxPlayers: 4,
    features: ['Unlimited Tiles', 'Extended Gameplay', 'Stack Forever'],
    tileCount: { 
      field: 50,     // Lots of tiles for Tetris-style gameplay
      forest: 50, 
      pasture: 50, 
      hill: 40, 
      mountain: 40, 
      desert: 10, 
      water: 0,      // No water tiles in endless mode
      gold: 10 
    }
  },
  {
    id: 'cities-knights',
    name: 'Cities & Knights',
    description: 'Defend Catan from barbarian invasions.',
    mapSize: 2, // Standard board size
    maxPlayers: 4,
    features: ['Knights', 'City Walls', 'Commodities', 'Barbarians'],
    tileCount: { 
      field: 4, 
      forest: 4, 
      pasture: 4, 
      hill: 3, 
      mountain: 3, 
      desert: 1, 
      water: 0, 
      gold: 0 
    }
  }
];

// Helper function to calculate expected hex count for a given map size
export const calculateHexCount = (mapSize: number): number => {
  if (mapSize === 2) return 19;  // Classic Catan
  if (mapSize === 3) return 37;  // 5-6 player expansion
  if (mapSize === 4) return 61;  // Large Seafarers map
  
  // Generic calculation for other sizes
  let count = 0;
  for (let q = -mapSize; q <= mapSize; q++) {
    const r1 = Math.max(-mapSize, -q - mapSize);
    const r2 = Math.min(mapSize, -q + mapSize);
    for (let r = r1; r <= r2; r++) {
      const s = -q - r;
      if (Math.abs(q) <= mapSize && Math.abs(r) <= mapSize && Math.abs(s) <= mapSize) {
        count++;
      }
    }
  }
  return count;
};

// Validation function
export const validateGameMode = (mode: GameMode): { isValid: boolean; message: string } => {
  const expectedHexes = calculateHexCount(mode.mapSize);
  const totalTiles = Object.values(mode.tileCount).reduce((sum, count) => sum + count, 0);
  
  if (totalTiles < expectedHexes) {
    return {
      isValid: false,
      message: `Not enough tiles! Need ${expectedHexes} tiles but only have ${totalTiles}`
    };
  }
  
  return { isValid: true, message: 'Valid configuration' };
};

interface GameModeSelectorProps {
  onSelectMode: (mode: GameMode) => void;
}

export const GameModeSelector = ({ onSelectMode }: GameModeSelectorProps) => {
  return (
    <div className="min-h-screen bg-gradient-background p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4 sm:mb-6 md:mb-12">
          <div className="relative mb-3 sm:mb-4 md:mb-8">
            <img 
              src={heroIsland} 
              alt="Tetris Catan Island" 
              className="w-full max-w-4xl mx-auto rounded-lg sm:rounded-xl md:rounded-2xl shadow-medieval border sm:border-2 md:border-4 border-primary/20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-lg sm:rounded-xl md:rounded-2xl"></div>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-primary mb-2 sm:mb-3 md:mb-4 drop-shadow-lg">
            Tetris Catan
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
            Build the perfect island as terrain tiles fall from above. 
            <span className="hidden sm:inline"> Combine the strategy of Catan with the puzzle mechanics of Tetris.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {GAME_MODES.map((mode) => (
            <Card 
              key={mode.id} 
              className="bg-card/80 backdrop-blur-sm border-border/50 shadow-medieval hover:shadow-glow-primary transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] md:hover:scale-105 cursor-pointer group active:scale-[0.98]"
              onClick={() => onSelectMode(mode)}
            >
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <CardTitle className="text-base sm:text-lg md:text-2xl text-primary group-hover:text-accent transition-colors leading-tight">
                    {mode.name}
                  </CardTitle>
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2 py-0 sm:py-1">
                      {mode.maxPlayers} Players
                    </Badge>
                    <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2 py-0 sm:py-1">
                      {calculateHexCount(mode.mapSize)} Hexes
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-none">
                  {mode.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0 md:pt-0">
                <div className="space-y-1 sm:space-y-2 md:space-y-3">
                  <h4 className="font-semibold text-xs sm:text-sm md:text-base text-foreground">Features:</h4>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
                    {mode.features.map((feature) => (
                      <Badge 
                        key={feature} 
                        variant="outline" 
                        className="text-[10px] sm:text-xs bg-accent/10 text-accent-foreground border-accent/20 px-1 sm:px-2 py-0 sm:py-1"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Show tile count summary for Seafarers modes */}
                  {mode.id.includes('seafarers') && (
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {mode.tileCount.water} water • {Object.values(mode.tileCount).reduce((sum, count) => sum + count, 0) - mode.tileCount.water - mode.tileCount.desert} resource • {mode.tileCount.gold} gold
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center px-2 sm:px-4">
          <Card className="inline-block bg-card/60 backdrop-blur-sm border-border/30 p-3 sm:p-4 md:p-6 max-w-full">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground mb-1 sm:mb-2">How to Play</h3>
            <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground space-y-0.5 sm:space-y-1 max-w-md text-left">
              <p className="hidden sm:block">• Terrain tiles automatically fall from the top</p>
              <p className="hidden sm:block">• Use ← → arrow keys to move tiles left/right</p>
              <p className="hidden sm:block">• Press ↓ to speed up the drop</p>
              <p className="hidden sm:block">• Press SPACE to instantly place (hard drop)</p>
              <p className="hidden sm:block">• Press ↑ to rotate tiles (visual only)</p>
              <p className="sm:hidden">• Tap the board to move falling tiles</p>
              <p className="sm:hidden">• Tiles automatically fall and stack</p>
              <p>• Stack terrain to build your perfect Catan island!</p>
              <p className="mt-2 font-semibold">• Desert and water tiles won't receive numbers</p>
              <p className="font-semibold">• Gold tiles DO receive number tokens!</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};