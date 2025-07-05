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
      field: 6,      // Wheat
      forest: 6,     // Wood
      pasture: 6,    // Sheep
      hill: 5,       // Brick
      mountain: 5,   // Ore
      desert: 2,     // Desert
      water: 0,      // No water tiles
      gold: 0 
    }
  },
  {
    id: 'tetris-mode',
    name: 'Tetris Mode - Endless',
    description: 'Infinite tiles for endless building fun!',
    mapSize: 3,
    maxPlayers: 4,
    features: ['Infinite Tiles', 'Endless Gameplay', 'Stack and Build'],
    tileCount: { 
      field: 50,     // Lots of tiles for Tetris-style gameplay
      forest: 50, 
      pasture: 50, 
      hill: 40, 
      mountain: 40, 
      desert: 10, 
      water: 0,      // No water tiles
      gold: 10 
    }
  },
  {
    id: 'seafarers-heading-for-new-shores',
    name: 'Seafarers: New Shores',
    description: 'Discover uncharted islands across the sea.',
    mapSize: 4,
    maxPlayers: 4,
    features: ['Multiple Islands', 'Ships', 'Gold Hexes', 'Sea Routes'],
    tileCount: { 
      field: 5, 
      forest: 5, 
      pasture: 5, 
      hill: 4, 
      mountain: 4, 
      desert: 2, 
      water: 0,      // No water tiles in Tetris mode
      gold: 2        // Gold fields
    }
  },
  {
    id: 'seafarers-fog-islands',
    name: 'Seafarers: Fog Islands',
    description: 'Navigate through mysterious fog to find new lands.',
    mapSize: 4,
    maxPlayers: 4,
    features: ['Hidden Tiles', 'Exploration', 'Fog Banks', 'Gold Discovery'],
    tileCount: { 
      field: 4, 
      forest: 4, 
      pasture: 4, 
      hill: 3, 
      mountain: 3, 
      desert: 1, 
      water: 0,      // No water tiles in Tetris mode
      gold: 3 
    }
  },
  {
    id: 'cities-knights-3-4',
    name: 'Cities & Knights (3-4 Players)',
    description: 'Defend Catan from barbarian invasions.',
    mapSize: 2, // Matched to base game
    maxPlayers: 4,
    features: ['Knights', 'City Walls', 'Progress Cards', 'Barbarians'],
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
  },
  {
    id: 'explorers-pirates',
    name: 'Explorers & Pirates',
    description: 'Set sail for adventure and discovery.',
    mapSize: 5, // Large map
    maxPlayers: 4,
    features: ['Missions', 'Pirate Lairs', 'Fish', 'Spices', 'Harbor Settlement'],
    tileCount: { 
      field: 3, 
      forest: 3, 
      pasture: 4, 
      hill: 2, 
      mountain: 2, 
      desert: 1, 
      water: 0,      // No water tiles in Tetris mode
      gold: 5        // Includes fish/spice hexes
    }
  }
];

// Helper function to calculate expected hex count for a given map size
export const calculateHexCount = (mapSize: number): number => {
  let count = 0;
  for (let q = -mapSize; q <= mapSize; q++) {
    const r1 = Math.max(-mapSize, -q - mapSize);
    const r2 = Math.min(mapSize, -q + mapSize);
    for (let r = r1; r <= r2; r++) {
      const s = -q - r;
      // Skip corners for more authentic Catan shape
      if (Math.abs(q) === mapSize && Math.abs(r) === mapSize) continue;
      if (Math.abs(q) === mapSize && Math.abs(s) === mapSize) continue;
      if (Math.abs(r) === mapSize && Math.abs(s) === mapSize) continue;
      count++;
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
    <div className="min-h-screen bg-gradient-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <div className="relative mb-6 md:mb-8">
            <img 
              src={heroIsland} 
              alt="Tetris Catan Island" 
              className="w-full max-w-4xl mx-auto rounded-xl md:rounded-2xl shadow-medieval border-2 md:border-4 border-primary/20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-xl md:rounded-2xl"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-3 md:mb-4 drop-shadow-lg">
            Tetris Catan
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Build the perfect island as terrain tiles fall from above. 
            Combine the strategy of Catan with the puzzle mechanics of Tetris.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 px-2 sm:px-0">
          {GAME_MODES.map((mode) => (
            <Card 
              key={mode.id} 
              className="bg-card/80 backdrop-blur-sm border-border/50 shadow-medieval hover:shadow-glow-primary transition-all duration-300 hover:scale-[1.02] md:hover:scale-105 cursor-pointer group active:scale-[0.98]"
              onClick={() => onSelectMode(mode)}
            >
              <CardHeader className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                  <CardTitle className="text-lg md:text-2xl text-primary group-hover:text-accent transition-colors">
                    {mode.name}
                  </CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {mode.maxPlayers} Players
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Size {mode.mapSize}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-sm md:text-base">
                  {mode.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <div className="space-y-2 md:space-y-3">
                  <h4 className="font-semibold text-sm md:text-base text-foreground">Features:</h4>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {mode.features.map((feature) => (
                      <Badge 
                        key={feature} 
                        variant="outline" 
                        className="text-xs bg-accent/10 text-accent-foreground border-accent/20"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center px-4">
          <Card className="inline-block bg-card/60 backdrop-blur-sm border-border/30 p-4 md:p-6 max-w-full">
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">How to Play</h3>
            <div className="text-xs md:text-sm text-muted-foreground space-y-1 max-w-md text-left">
              <p>• Terrain tiles automatically fall from the top</p>
              <p>• Use ← → arrow keys to move tiles left/right</p>
              <p>• Press ↓ to speed up the drop</p>
              <p>• Press SPACE to instantly place (hard drop)</p>
              <p>• Press ↑ to rotate tiles (visual only)</p>
              <p>• Stack terrain to build your perfect Catan island!</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};