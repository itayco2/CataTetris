import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TerrainTile } from './TerrainTile';
import { FallingTile } from './FallingTile';
import { NextTilePreview } from './NextTilePreview';
import { useTileQueue } from '@/hooks/useTileQueue';
import { TileCount } from './GameModeSelector';

export type TerrainType = 'forest' | 'field' | 'mountain' | 'pasture' | 'hill' | 'desert' | 'water' | 'gold';

export interface Hex {
  q: number;
  r: number;
  terrain?: TerrainType;
  hasSettlement?: boolean;
  hasCity?: boolean;
  hasRoad?: boolean;
  isWater?: boolean;
  number?: number;
}

interface GameBoardProps {
  mapSize: number;
  isPlaying: boolean;
  tileCount: TileCount;
  onTilePlaced?: (terrain: TerrainType) => void;
}

export const GameBoard = ({ mapSize, isPlaying, tileCount, onTilePlaced }: GameBoardProps) => {
  const [board, setBoard] = useState<Map<string, Hex>>(new Map());
  const [tilePosition, setTilePosition] = useState({ q: 0, r: 0 });
  const [tileRotation, setTileRotation] = useState(0);
  const dropTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [dropSpeed, setDropSpeed] = useState(1000);

  const {
    currentTile,
    nextTile,
    upcomingTiles,
    remainingTiles,
    getNextTile,
    hasMoreTiles
  } = useTileQueue({ tileCount, isPlaying });

  // Generate authentic Catan board layout
  const generateCatanBoard = (size: number): Hex[] => {
    const hexes: Hex[] = [];
    
    if (size === 2) {
      // Classic Catan island shape - hexagonal outline
      const landHexes = [
        // Center hex
        { q: 0, r: 0 },
        // Inner ring (6 hexes around center)
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 }, 
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
        // Outer ring (12 hexes)
        { q: 2, r: 0 }, { q: 2, r: -1 }, { q: 2, r: -2 }, 
        { q: 1, r: -2 }, { q: 0, r: -2 }, { q: -1, r: -1 },
        { q: -2, r: 0 }, { q: -2, r: 1 }, { q: -2, r: 2 },
        { q: -1, r: 2 }, { q: 0, r: 2 }, { q: 1, r: 1 }
      ];
      
      // Ocean border in hexagonal pattern
      const waterHexes = [
        // Top edge
        { q: 1, r: -3 }, { q: 0, r: -3 }, { q: -1, r: -2 },
        // Top-right edge
        { q: 3, r: -2 }, { q: 3, r: -1 }, { q: 3, r: 0 },
        // Bottom-right edge
        { q: 2, r: 1 }, { q: 1, r: 2 }, { q: 0, r: 3 },
        // Bottom edge
        { q: -1, r: 3 }, { q: -2, r: 3 }, { q: -3, r: 2 },
        // Bottom-left edge
        { q: -3, r: 1 }, { q: -3, r: 0 }, { q: -3, r: -1 },
        // Top-left edge
        { q: -2, r: -1 }, { q: -1, r: -3 }, { q: 2, r: -3 }
      ];
      
      // Add land hexes
      landHexes.forEach(hex => {
        hexes.push({ ...hex, terrain: undefined });
      });
      
      // Add water hexes
      waterHexes.forEach(hex => {
        hexes.push({ ...hex, terrain: 'water', isWater: true });
      });
      
    } else if (size === 3) {
      // Larger hexagonal island for 5-6 players
      const landHexes = [
        // Center
        { q: 0, r: 0 },
        // Ring 1
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 }, 
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
        // Ring 2
        { q: 2, r: 0 }, { q: 2, r: -1 }, { q: 2, r: -2 }, 
        { q: 1, r: -2 }, { q: 0, r: -2 }, { q: -1, r: -1 },
        { q: -2, r: 0 }, { q: -2, r: 1 }, { q: -2, r: 2 },
        { q: -1, r: 2 }, { q: 0, r: 2 }, { q: 1, r: 1 },
        // Ring 3 (additional outer land hexes)
        { q: 3, r: -1 }, { q: 3, r: -2 }, { q: 2, r: -3 },
        { q: 1, r: -3 }, { q: 0, r: -3 }, { q: -1, r: -2 },
        { q: -2, r: -1 }, { q: -3, r: 0 }, { q: -3, r: 1 },
        { q: -3, r: 2 }, { q: -2, r: 3 }, { q: -1, r: 3 },
        { q: 0, r: 3 }, { q: 1, r: 2 }, { q: 2, r: 1 }, { q: 3, r: 0 }
      ];
      
      // Ocean border
      const waterHexes = [
        // Outer ocean ring
        { q: 4, r: -2 }, { q: 4, r: -1 }, { q: 4, r: 0 }, { q: 3, r: 1 },
        { q: 2, r: 2 }, { q: 1, r: 3 }, { q: 0, r: 4 }, { q: -1, r: 4 },
        { q: -2, r: 4 }, { q: -3, r: 3 }, { q: -4, r: 2 }, { q: -4, r: 1 },
        { q: -4, r: 0 }, { q: -4, r: -1 }, { q: -3, r: -2 }, { q: -2, r: -3 },
        { q: -1, r: -4 }, { q: 0, r: -4 }, { q: 1, r: -4 }, { q: 2, r: -4 },
        { q: 3, r: -3 }, { q: 4, r: -3 }
      ];
      
      landHexes.forEach(hex => {
        hexes.push({ ...hex, terrain: undefined });
      });
      
      waterHexes.forEach(hex => {
        hexes.push({ ...hex, terrain: 'water', isWater: true });
      });
    } else {
      // Fallback circular pattern
      for (let q = -size; q <= size; q++) {
        const r1 = Math.max(-size, -q - size);
        const r2 = Math.min(size, -q + size);
        for (let r = r1; r <= r2; r++) {
          const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
          
          if (distance <= size) {
            if (distance <= size - 1) {
              hexes.push({ q, r, terrain: undefined });
            } else {
              hexes.push({ q, r, terrain: 'water', isWater: true });
            }
          }
        }
      }
    }
    
    return hexes;
  };

  const hexes = generateCatanBoard(mapSize);

  // Convert hex coordinates to pixel coordinates
  const hexToPixel = (q: number, r: number, size: number = 35) => {
    const x = size * (3/2 * q);
    const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  };

  // Check if position is valid for placement (only land hexes)
  const isValidPosition = (q: number, r: number): boolean => {
    const hex = hexes.find(h => h.q === q && h.r === r);
    return hex !== undefined && !hex.isWater;
  };

  // Get valid spawn positions (top row land hexes)
  const getValidSpawnPositions = () => {
    const landHexes = hexes.filter(h => !h.isWater);
    const topRow = Math.min(...landHexes.map(h => h.r));
    return landHexes.filter(h => h.r === topRow);
  };

  // Spawn new falling tile at top
  const spawnNewTile = useCallback(() => {
    if (!isPlaying || !hasMoreTiles) return;
    
    const validSpawnPositions = getValidSpawnPositions();
    
    if (validSpawnPositions.length > 0) {
      const randomPos = validSpawnPositions[Math.floor(Math.random() * validSpawnPositions.length)];
      setTilePosition({ q: randomPos.q, r: randomPos.r });
      setTileRotation(0);
    }
  }, [isPlaying, hasMoreTiles]);

  // Handle tile placement
  const placeTile = useCallback((q: number, r: number) => {
    if (!currentTile || !isValidPosition(q, r)) return;
    
    const key = `${q},${r}`;
    const newBoard = new Map(board);
    
    // Allow overlapping - place new terrain over existing
    newBoard.set(key, { q, r, terrain: currentTile });
    setBoard(newBoard);
    
    // Notify parent component
    onTilePlaced?.(currentTile);
    
    // Get next tile from queue
    getNextTile();
    
    // Spawn next tile after brief delay
    setTimeout(spawnNewTile, 200);
  }, [currentTile, board, onTilePlaced, getNextTile, spawnNewTile]);

  // Auto-drop tile down one position
  const autoDropTile = useCallback(() => {
    if (!currentTile || !isPlaying) return;
    
    setTilePosition(prev => {
      const newR = prev.r + 1;
      const nextKey = `${prev.q},${newR}`;
      
      // Check if valid position
      if (!isValidPosition(prev.q, newR)) {
        // Reached edge, place tile
        placeTile(prev.q, prev.r);
        return prev;
      }
      
      // Check if next position would collide with existing tile
      if (board.has(nextKey) && board.get(nextKey)?.terrain) {
        // Place above the collision point
        placeTile(prev.q, prev.r);
        return prev;
      }
      
      return { ...prev, r: newR };
    });
  }, [currentTile, isPlaying, board, placeTile]);

  // Hard drop (spacebar) - instantly place tile
  const hardDrop = useCallback(() => {
    if (!currentTile || !isPlaying) return;
    
    let dropR = tilePosition.r;
    const landHexes = hexes.filter(h => !h.isWater);
    const maxR = Math.max(...landHexes.map(h => h.r));
    
    // Find the lowest valid position without collision
    while (dropR < maxR) {
      const nextR = dropR + 1;
      const key = `${tilePosition.q},${nextR}`;
      
      // Check if next position is valid
      if (!isValidPosition(tilePosition.q, nextR)) break;
      
      // Check if collision
      if (board.has(key) && board.get(key)?.terrain) break;
      
      dropR = nextR;
    }
    
    placeTile(tilePosition.q, dropR);
  }, [currentTile, isPlaying, tilePosition, placeTile, hexes, board]);

  // Handle keyboard controls with repeat
  useEffect(() => {
    let moveInterval: NodeJS.Timeout | null = null;
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentTile || !isPlaying || keys[e.key]) return;
      
      keys[e.key] = true;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          // Immediate move
          setTilePosition(prev => {
            const newQ = prev.q - 1;
            const key = `${newQ},${prev.r}`;
            const hasCollision = board.has(key) && board.get(key)?.terrain;
            return isValidPosition(newQ, prev.r) && !hasCollision ? { ...prev, q: newQ } : prev;
          });
          // Set up repeat
          moveInterval = setInterval(() => {
            setTilePosition(prev => {
              const newQ = prev.q - 1;
              const key = `${newQ},${prev.r}`;
              const hasCollision = board.has(key) && board.get(key)?.terrain;
              return isValidPosition(newQ, prev.r) && !hasCollision ? { ...prev, q: newQ } : prev;
            });
          }, 100);
          break;
          
        case 'ArrowRight':
          e.preventDefault();
          // Immediate move
          setTilePosition(prev => {
            const newQ = prev.q + 1;
            const key = `${newQ},${prev.r}`;
            const hasCollision = board.has(key) && board.get(key)?.terrain;
            return isValidPosition(newQ, prev.r) && !hasCollision ? { ...prev, q: newQ } : prev;
          });
          // Set up repeat
          moveInterval = setInterval(() => {
            setTilePosition(prev => {
              const newQ = prev.q + 1;
              const key = `${newQ},${prev.r}`;
              const hasCollision = board.has(key) && board.get(key)?.terrain;
              return isValidPosition(newQ, prev.r) && !hasCollision ? { ...prev, q: newQ } : prev;
            });
          }, 100);
          break;
          
        case 'ArrowDown':
          e.preventDefault();
          // Make drop faster while held
          setDropSpeed(100);
          break;
          
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setTileRotation(prev => (prev + 60) % 360);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
      
      if (e.key === 'ArrowDown') {
        // Reset drop speed
        setDropSpeed(1000);
      }
      
      if (moveInterval) {
        clearInterval(moveInterval);
        moveInterval = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (moveInterval) clearInterval(moveInterval);
    };
  }, [currentTile, isPlaying, hardDrop, board]);

  // Auto-drop timer
  useEffect(() => {
    if (!isPlaying || !currentTile) {
      if (dropTimerRef.current) {
        clearInterval(dropTimerRef.current);
        dropTimerRef.current = null;
      }
      return;
    }

    dropTimerRef.current = setInterval(autoDropTile, dropSpeed);
    
    return () => {
      if (dropTimerRef.current) {
        clearInterval(dropTimerRef.current);
        dropTimerRef.current = null;
      }
    };
  }, [isPlaying, currentTile, autoDropTile, dropSpeed]);

  // Spawn first tile when game starts
  useEffect(() => {
    if (isPlaying && currentTile && !dropTimerRef.current) {
      spawnNewTile();
    }
  }, [isPlaying, currentTile, spawnNewTile]);

  // Speed up tile drops over time
  useEffect(() => {
    if (!isPlaying) return;
    
    const speedUpInterval = setInterval(() => {
      setDropSpeed(prev => Math.max(300, prev - 20)); // Minimum 300ms, decrease by 20ms
    }, 20000); // Speed up every 20 seconds

    return () => clearInterval(speedUpInterval);
  }, [isPlaying]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Next Tile Preview */}
      <div className="lg:col-span-1 order-1">
        <NextTilePreview nextTile={nextTile} upcomingTiles={upcomingTiles} />
        
        {/* Remaining Tiles Counter */}
        <Card className="mt-4 bg-card/60 backdrop-blur-sm border-border/30">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Remaining Tiles</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(remainingTiles).map(([terrain, count]) => (
                count > 0 && (
                  <div key={terrain} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">{terrain}:</span>
                    <span className="text-foreground">{count}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Game Board */}
      <div className="lg:col-span-3 order-2">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-border/50 shadow-2xl min-h-[600px]">
          {/* Ocean background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-blue-800/10 to-blue-700/10"></div>
          
          {/* Catan Board Frame with hexagonal border */}
          <div className="absolute inset-4 rounded-lg border-4 border-amber-600/40 bg-gradient-to-br from-amber-900/5 to-amber-800/5 shadow-inner">
            {/* Decorative corner elements */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500/60"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500/60"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500/60"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500/60"></div>
          </div>
          
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <svg 
              viewBox="-300 -300 600 600" 
              className="w-full h-full max-w-[700px] max-h-[700px]"
            >
              {/* Ocean waves background pattern */}
              <defs>
                <pattern id="ocean-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="15" fill="#1e3a5f" opacity="0.1" />
                  <circle cx="20" cy="20" r="8" fill="#2F4F4F" opacity="0.15" />
                </pattern>
                
                <linearGradient id="hex-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="black" stopOpacity="0.1" />
                </linearGradient>
                
                <linearGradient id="water-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4682B4" />
                  <stop offset="50%" stopColor="#1e3a5f" />
                  <stop offset="100%" stopColor="#2F4F4F" />
                </linearGradient>
                
                <linearGradient id="board-frame" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B4513" />
                  <stop offset="50%" stopColor="#A0522D" />
                  <stop offset="100%" stopColor="#654321" />
                </linearGradient>
                
                {/* Hexagonal island outline */}
                <filter id="island-glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                {/* Wood texture filter */}
                <filter id="wood-texture">
                  <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" />
                  <feColorMatrix in="noise" type="saturate" values="0.3"/>
                  <feBlend in="SourceGraphic" in2="noise" mode="multiply"/>
                </filter>
              </defs>
              
              {/* Ocean background */}
              <rect x="-300" y="-300" width="600" height="600" fill="url(#ocean-pattern)" />
              
              {/* Hexagonal board outline (like the wooden frame) */}
              <polygon 
                points="0,-220 190,-110 190,110 0,220 -190,110 -190,-110"
                fill="none" 
                stroke="url(#board-frame)" 
                strokeWidth="12" 
                opacity="0.6"
                filter="url(#wood-texture)"
              />
              
              {/* Inner hexagonal border */}
              <polygon 
                points="0,-210 180,-105 180,105 0,210 -180,105 -180,-105"
                fill="none" 
                stroke="#DAA520" 
                strokeWidth="3" 
                opacity="0.8"
              />
              
              {/* Render all hexes */}
              {hexes.map(hex => {
                const { x, y } = hexToPixel(hex.q, hex.r);
                const key = `${hex.q},${hex.r}`;
                const placedHex = board.get(key);
                
                return (
                  <TerrainTile
                    key={key}
                    x={x}
                    y={y}
                    terrain={placedHex?.terrain || (hex.isWater ? 'water' : undefined)}
                    hasSettlement={placedHex?.hasSettlement}
                    hasCity={placedHex?.hasCity}
                    onClick={() => {
                      if (currentTile && isPlaying && !hex.isWater) {
                        placeTile(hex.q, hex.r);
                      }
                    }}
                  />
                );
              })}
              
              {/* Render falling tile */}
              {currentTile && isPlaying && (
                <FallingTile
                  x={hexToPixel(tilePosition.q, tilePosition.r).x}
                  y={hexToPixel(tilePosition.q, tilePosition.r).y}
                  terrain={currentTile}
                  rotation={tileRotation}
                />
              )}
              
              {/* Add harbor indicators for classic board */}
              {mapSize === 2 && (
                <g opacity="0.7">
                  {/* 3:1 Generic harbors */}
                  <g transform="translate(-140, -150)">
                    <rect x="-12" y="-6" width="24" height="12" fill="#8B4513" rx="3" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="10" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  <g transform="translate(140, -150)">
                    <rect x="-12" y="-6" width="24" height="12" fill="#8B4513" rx="3" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="10" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  <g transform="translate(-160, 80)">
                    <rect x="-12" y="-6" width="24" height="12" fill="#8B4513" rx="3" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="10" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  <g transform="translate(160, 80)">
                    <rect x="-12" y="-6" width="24" height="12" fill="#8B4513" rx="3" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="10" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  
                  {/* 2:1 Specialized harbors */}
                  <g transform="translate(0, -180)">
                    <rect x="-12" y="-6" width="24" height="12" fill="#654321" rx="3" stroke="#8B4513" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="9" fill="#FFD700" fontWeight="bold">2:1</text>
                  </g>
                  <g transform="translate(0, 180)">
                    <rect x="-12" y="-6" width="24" height="12" fill="#654321" rx="3" stroke="#8B4513" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="9" fill="#FFD700" fontWeight="bold">2:1</text>
                  </g>
                </g>
              )}
              
              {/* Catan logo/title in the ocean */}
              <text x="0" y="-260" textAnchor="middle" fontSize="16" fill="#DAA520" fontWeight="bold" opacity="0.8">
                CATAN ISLAND
              </text>
            </svg>
            
            {/* Controls instruction */}
            {isPlaying && (
              <div className="absolute bottom-4 left-4 text-sm text-muted-foreground bg-card/90 p-3 rounded-lg backdrop-blur-sm border border-border/30">
                <div className="font-semibold text-foreground mb-1">Controls:</div>
                <div>← → : Move tile left/right</div>
                <div>↓ : Speed up drop</div>
                <div>↑ : Rotate tile (visual only)</div>
                <div>SPACE : Hard drop (instant place)</div>
              </div>
            )}

            {/* Game Over */}
            {!hasMoreTiles && isPlaying && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <Card className="p-6 text-center border-2 border-primary/50 bg-card/90 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-primary mb-2">🏝️ Island Complete! 🏝️</h2>
                  <p className="text-muted-foreground">All terrain tiles have been placed.</p>
                  <p className="text-sm text-muted-foreground mt-2">The settlers can now build their civilization!</p>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};