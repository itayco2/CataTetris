import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TerrainTile } from './TerrainTile';
import { FallingTile } from './FallingTile';
import { NextTilePreview } from './NextTilePreview';
import { useTileQueue } from '@/hooks/useTileQueue';
import { TileCount } from './GameModeSelector';
import { Button } from '@/components/ui/button';

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
  onGameEnd?: () => void;
  resetTrigger?: number;
}

export const GameBoard = ({ 
  mapSize, 
  isPlaying, 
  tileCount, 
  onTilePlaced, 
  onGameEnd, 
  resetTrigger 
}: GameBoardProps) => {
  // ========== STATE MANAGEMENT ==========
  const [board, setBoard] = useState<Map<string, Hex>>(new Map());
  const [tilePosition, setTilePosition] = useState({ q: 0, r: 0 });
  const [tileRotation, setTileRotation] = useState(0);
  const dropTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [dropSpeed, setDropSpeed] = useState(1000);
  const [showFinalBoard, setShowFinalBoard] = useState(false);
  const [boardNumbers, setBoardNumbers] = useState<Map<string, number>>(new Map());

  // Use tile queue hook
  const {
    currentTile,
    nextTile,
    upcomingTiles,
    remainingTiles,
    getNextTile,
    hasMoreTiles,
    resetQueue
  } = useTileQueue({ tileCount, isPlaying });

  // ========== RESET GAME ==========
  useEffect(() => {
    setBoard(new Map());
    setTilePosition({ q: 0, r: 0 });
    setTileRotation(0);
    setDropSpeed(1000);
    setShowFinalBoard(false);
    setBoardNumbers(new Map());
    if (dropTimerRef.current) {
      clearInterval(dropTimerRef.current);
      dropTimerRef.current = null;
    }
    resetQueue();
  }, [resetTrigger, resetQueue]);

  // ========== BOARD GENERATION ==========
  const generateCatanBoard = (size: number): Hex[] => {
    const hexes: Hex[] = [];
    
    if (size === 2) {
      // Classic Catan island shape - perfect hexagon (19 tiles)
      const landHexes = [
        // Center hex
        { q: 0, r: 0 },
        // Inner ring (6 hexes)
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 }, 
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
        // Outer ring (12 hexes) - completing the 19 land tiles
        { q: 2, r: 0 }, { q: 2, r: -1 }, { q: 2, r: -2 }, 
        { q: 1, r: -2 }, { q: 0, r: -2 }, { q: -1, r: -1 },
        { q: -2, r: 0 }, { q: -2, r: 1 }, { q: -2, r: 2 },
        { q: -1, r: 2 }, { q: 0, r: 2 }, { q: 1, r: 1 }
      ];
      
      // Add land hexes only - no water border
      landHexes.forEach(hex => {
        hexes.push({ ...hex, terrain: undefined });
      });
      
    } else if (size === 3) {
      // Extended hexagon for 5-6 players (37 tiles)
      const landHexes = [];
      // Generate hexagon with radius 3
      for (let q = -3; q <= 3; q++) {
        const r1 = Math.max(-3, -q - 3);
        const r2 = Math.min(3, -q + 3);
        for (let r = r1; r <= r2; r++) {
          const s = -q - r;
          if (Math.abs(q) <= 3 && Math.abs(r) <= 3 && Math.abs(s) <= 3) {
            landHexes.push({ q, r });
          }
        }
      }
      
      landHexes.forEach(hex => {
        hexes.push({ ...hex, terrain: undefined });
      });
    } else {
      // Fallback for other sizes - no water border
      for (let q = -size; q <= size; q++) {
        const r1 = Math.max(-size, -q - size);
        const r2 = Math.min(size, -q + size);
        for (let r = r1; r <= r2; r++) {
          const s = -q - r;
          const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
          
          if (distance <= size) {
            hexes.push({ q, r, terrain: undefined });
          }
        }
      }
    }
    
    return hexes;
  };

  const hexes = generateCatanBoard(mapSize);

  // ========== NUMBER GENERATION ==========
  const generateNumberTokens = useCallback(() => {
    // Authentic Catan number distribution
    const numberDistribution = mapSize === 2 
      ? [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12] // 18 numbers for classic
      : [2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12]; // More for extended
    
    // Get all land tiles that need numbers (exclude desert, water, gold)
    const numberTiles = [];
    board.forEach((hex, key) => {
      if (hex.terrain && hex.terrain !== 'desert' && hex.terrain !== 'water' && hex.terrain !== 'gold') {
        numberTiles.push({ key, q: hex.q, r: hex.r });
      }
    });
    
    // Log for debugging
    console.log('Board size:', board.size);
    console.log('Tiles needing numbers:', numberTiles.length);
    console.log('Numbers available:', numberDistribution.length);
    
    // Helper function to get adjacent hexes
    const getAdjacentHexes = (q: number, r: number) => {
      return [
        { q: q + 1, r: r },
        { q: q - 1, r: r },
        { q: q, r: r + 1 },
        { q: q, r: r - 1 },
        { q: q + 1, r: r - 1 },
        { q: q - 1, r: r + 1 }
      ];
    };
    
    // Helper function to check if a number placement is valid
    const isValidPlacement = (tileKey: string, number: number, placedNumbers: Map<string, number>) => {
      if (number !== 6 && number !== 8) return true; // Only 6 and 8 have restrictions
      
      const tile = numberTiles.find(t => t.key === tileKey);
      if (!tile) return false;
      
      const adjacentHexes = getAdjacentHexes(tile.q, tile.r);
      
      // Check if any adjacent hex has a 6 or 8
      for (const adj of adjacentHexes) {
        const adjKey = `${adj.q},${adj.r}`;
        const adjNumber = placedNumbers.get(adjKey);
        if (adjNumber === 6 || adjNumber === 8) {
          return false; // Can't place 6 or 8 next to another 6 or 8
        }
      }
      
      return true;
    };
    
    // Separate high probability numbers (6, 8) from others
    const highProbNumbers = numberDistribution.filter(n => n === 6 || n === 8);
    const otherNumbers = numberDistribution.filter(n => n !== 6 && n !== 8);
    
    const newNumbers = new Map<string, number>();
    const availableTiles = [...numberTiles];
    
    // First, place 6s and 8s ensuring they're not adjacent
    for (const number of highProbNumbers) {
      let placed = false;
      
      // Try random positions until we find a valid one
      for (let attempts = 0; attempts < 100 && !placed; attempts++) {
        const randomIndex = Math.floor(Math.random() * availableTiles.length);
        const tile = availableTiles[randomIndex];
        
        if (isValidPlacement(tile.key, number, newNumbers)) {
          newNumbers.set(tile.key, number);
          availableTiles.splice(randomIndex, 1);
          placed = true;
        }
      }
      
      // If we couldn't place it randomly, just place it anywhere available
      if (!placed && availableTiles.length > 0) {
        const tile = availableTiles.shift();
        if (tile) newNumbers.set(tile.key, number);
      }
    }
    
    // Then place all other numbers randomly
    const shuffledOthers = [...otherNumbers].sort(() => Math.random() - 0.5);
    
    // Make sure we have enough numbers for all tiles
    const numbersNeeded = availableTiles.length;
    const numbersAvailable = shuffledOthers.length;
    
    if (numbersNeeded > numbersAvailable) {
      console.warn(`Not enough numbers! Need ${numbersNeeded}, have ${numbersAvailable}`);
    }
    
    // Place remaining numbers
    for (let i = 0; i < availableTiles.length && i < shuffledOthers.length; i++) {
      const tile = availableTiles[i];
      const number = shuffledOthers[i];
      newNumbers.set(tile.key, number);
    }
    
    console.log('Numbers placed:', newNumbers.size);
    setBoardNumbers(newNumbers);
  }, [board, mapSize]);

  // ========== COORDINATE CONVERSION ==========
  const hexToPixel = (q: number, r: number, size: number = 35) => {
    const x = size * (3/2 * q);
    const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  };

  // ========== POSITION VALIDATION ==========
  const isValidPosition = (q: number, r: number): boolean => {
    const hex = hexes.find(h => h.q === q && h.r === r);
    return hex !== undefined && !hex.isWater;
  };

  // ========== SPAWN POSITIONS ==========
  const getValidSpawnPositions = () => {
    const landHexes = hexes.filter(h => !h.isWater);
    const topRow = Math.min(...landHexes.map(h => h.r));
    // Get all columns that have land hexes
    const validColumns = new Set(landHexes.map(h => h.q));
    // Return spawn positions for each valid column, 4 rows above the board
    return Array.from(validColumns).map(q => ({
      q,
      r: topRow - 4
    }));
  };

  // ========== SPAWN NEW TILE ==========
  const spawnNewTile = useCallback(() => {
    if (!isPlaying || !hasMoreTiles) return;
    
    const validSpawnPositions = getValidSpawnPositions();
    
    if (validSpawnPositions.length > 0) {
      const randomPos = validSpawnPositions[Math.floor(Math.random() * validSpawnPositions.length)];
      setTilePosition({ q: randomPos.q, r: randomPos.r });
      setTileRotation(0);
    }
  }, [isPlaying, hasMoreTiles]);

  // ========== PLACE TILE ==========
  const placeTile = useCallback((q: number, r: number) => {
    if (!currentTile || !isValidPosition(q, r)) return;
    
    const key = `${q},${r}`;
    const newBoard = new Map(board);
    
    // Check if position already has a tile - if so, reset to top
    if (newBoard.has(key) && newBoard.get(key)?.terrain) {
      spawnNewTile();
      return;
    }
    
    newBoard.set(key, { q, r, terrain: currentTile });
    setBoard(newBoard);
    
    // Notify parent component
    onTilePlaced?.(currentTile);
    
    // Get next tile from queue
    const nextTileFromQueue = getNextTile();
    
    // Check if we have more tiles
    if (nextTileFromQueue) {
      // Spawn next tile after brief delay
      setTimeout(spawnNewTile, 200);
    } else if (!hasMoreTiles && !showFinalBoard) {
      // No more tiles - generate numbers and end game
      setTimeout(() => {
        generateNumberTokens();
        setShowFinalBoard(true);
      }, 500);
    }
  }, [currentTile, board, onTilePlaced, getNextTile, spawnNewTile, hasMoreTiles, showFinalBoard, generateNumberTokens]);

  // ========== AUTO DROP ==========
  const autoDropTile = useCallback(() => {
    if (!currentTile || !isPlaying || showFinalBoard) return;
    
    setTilePosition(prev => {
      const newR = prev.r + 1;
      
      // Get all valid positions in current column
      const landHexes = hexes.filter(h => !h.isWater);
      const columnHexes = landHexes.filter(h => h.q === prev.q).sort((a, b) => a.r - b.r);
      
      if (columnHexes.length === 0) {
        // No valid positions in this column
        return prev;
      }
      
      // Find the lowest available position
      let targetR = columnHexes[columnHexes.length - 1].r; // Start with bottom-most position
      
      // Check each position from top to bottom
      for (let i = 0; i < columnHexes.length; i++) {
        const hex = columnHexes[i];
        const key = `${hex.q},${hex.r}`;
        if (board.has(key) && board.get(key)?.terrain) {
          // Found an occupied tile, place on top of it
          if (i === 0) {
            // Column is full from the top
            targetR = hex.r - 1;
          } else {
            targetR = columnHexes[i - 1].r;
          }
          break;
        }
      }
      
      // If we've reached or passed the target position, place the tile
      if (newR >= targetR) {
        placeTile(prev.q, targetR);
        return prev;
      }
      
      // Otherwise, continue falling
      return { ...prev, r: newR };
    });
  }, [currentTile, isPlaying, showFinalBoard, board, placeTile, hexes]);

  // ========== HARD DROP ==========
  const hardDrop = useCallback(() => {
    if (!currentTile || !isPlaying) return;
    
    const landHexes = hexes.filter(h => !h.isWater);
    const columnHexes = landHexes.filter(h => h.q === tilePosition.q).sort((a, b) => a.r - b.r);
    
    if (columnHexes.length === 0) return;
    
    // Find the lowest available position
    let targetR = columnHexes[columnHexes.length - 1].r; // Start with bottom-most position
    
    // Check each position from top to bottom
    for (let i = 0; i < columnHexes.length; i++) {
      const hex = columnHexes[i];
      const key = `${hex.q},${hex.r}`;
      if (board.has(key) && board.get(key)?.terrain) {
        // Found an occupied tile, place on top of it
        if (i === 0) {
          // Column is full from the top
          targetR = hex.r - 1;
        } else {
          targetR = columnHexes[i - 1].r;
        }
        break;
      }
    }
    
    placeTile(tilePosition.q, targetR);
  }, [currentTile, isPlaying, tilePosition, placeTile, hexes, board]);

  // ========== HANDLE BOARD CLICK ==========
  const handleBoardClick = useCallback((q: number, r: number) => {
    if (!currentTile || !isPlaying || showFinalBoard) return;
    
    // Check if clicked position is valid
    if (!isValidPosition(q, r)) return;
    
    // Check if position already has a tile
    const key = `${q},${r}`;
    if (board.has(key) && board.get(key)?.terrain) {
      // Reset tile to top
      spawnNewTile();
      return;
    }
    
    // Move tile to clicked position
    setTilePosition({ q, r });
  }, [currentTile, isPlaying, showFinalBoard, board, spawnNewTile]);

  // ========== KEYBOARD CONTROLS ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentTile || !isPlaying || showFinalBoard) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setTilePosition(prev => {
            const newQ = prev.q - 1;
            const key = `${newQ},${prev.r}`;
            
            // Check if we're above the board
            const landHexes = hexes.filter(h => !h.isWater);
            const topRow = Math.min(...landHexes.map(h => h.r));
            
            // If above board, check if the column has any valid positions
            if (prev.r < topRow) {
              const hasValidPositionInColumn = landHexes.some(h => h.q === newQ);
              return hasValidPositionInColumn ? { ...prev, q: newQ } : prev;
            }
            
            // On board, check for valid position and collision
            const hasCollision = board.has(key) && board.get(key)?.terrain;
            return isValidPosition(newQ, prev.r) && !hasCollision ? { ...prev, q: newQ } : prev;
          });
          break;
          
        case 'ArrowRight':
          e.preventDefault();
          setTilePosition(prev => {
            const newQ = prev.q + 1;
            const key = `${newQ},${prev.r}`;
            
            // Check if we're above the board
            const landHexes = hexes.filter(h => !h.isWater);
            const topRow = Math.min(...landHexes.map(h => h.r));
            
            // If above board, check if the column has any valid positions
            if (prev.r < topRow) {
              const hasValidPositionInColumn = landHexes.some(h => h.q === newQ);
              return hasValidPositionInColumn ? { ...prev, q: newQ } : prev;
            }
            
            // On board, check for valid position and collision
            const hasCollision = board.has(key) && board.get(key)?.terrain;
            return isValidPosition(newQ, prev.r) && !hasCollision ? { ...prev, q: newQ } : prev;
          });
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
      if (e.key === 'ArrowDown') {
        // Reset drop speed
        setDropSpeed(1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentTile, isPlaying, showFinalBoard, hardDrop, board, hexes, mapSize]);

  // ========== AUTO DROP TIMER ==========
  useEffect(() => {
    if (!isPlaying || !currentTile || showFinalBoard) {
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
  }, [isPlaying, currentTile, showFinalBoard, autoDropTile, dropSpeed]);

  // ========== SPAWN FIRST TILE ==========
  useEffect(() => {
    if (isPlaying && currentTile) {
      spawnNewTile();
    }
  }, [isPlaying, currentTile]);

  // ========== SPEED UP OVER TIME ==========
  useEffect(() => {
    if (!isPlaying) return;
    
    const speedUpInterval = setInterval(() => {
      setDropSpeed(prev => Math.max(300, prev - 20)); // Minimum 300ms, decrease by 20ms
    }, 20000); // Speed up every 20 seconds

    return () => clearInterval(speedUpInterval);
  }, [isPlaying]);

  // ========== GAME END CHECK ==========
  useEffect(() => {
    if (!hasMoreTiles && isPlaying && board.size > 0 && !showFinalBoard && !currentTile) {
      // Only end game if we've actually placed some tiles AND no current tile is active
      setTimeout(() => {
        generateNumberTokens();
        setShowFinalBoard(true);
      }, 500);
    }
  }, [hasMoreTiles, isPlaying, board.size, showFinalBoard, currentTile, generateNumberTokens]);

  // ========== RENDER ==========
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Game Board */}
      <div className="lg:col-span-3 order-2 lg:order-1">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-border/50 shadow-2xl min-h-[400px] sm:min-h-[500px] md:min-h-[600px] h-full">
          {/* Ocean background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-blue-800/10 to-blue-700/10"></div>
          
          {/* Catan Board Frame */}
          <div className="absolute inset-4 rounded-lg border-4 border-amber-600/40 bg-gradient-to-br from-amber-900/5 to-amber-800/5 shadow-inner">
            {/* Decorative corner elements */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500/60"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500/60"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500/60"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500/60"></div>
          </div>
          
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-8">
            <svg 
              viewBox={mapSize === 2 ? "-250 -280 500 560" : mapSize === 3 ? "-350 -380 700 760" : "-450 -480 900 960"}
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
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
              
              {/* Ocean background - full coverage */}
              <rect x="-100%" y="-100%" width="200%" height="200%" fill="url(#ocean-pattern)" />
              
              {/* Hexagonal board outline (like the wooden frame) - adjusted for map size */}
              <polygon 
                points={mapSize === 2 
                  ? "0,-154 133,-77 133,77 0,154 -133,77 -133,-77"
                  : mapSize === 3
                  ? "0,-231 199.5,-115.5 199.5,115.5 0,231 -199.5,115.5 -199.5,-115.5"
                  : "0,-308 266,-154 266,154 0,308 -266,154 -266,-154"
                }
                fill="none" 
                stroke="url(#board-frame)" 
                strokeWidth="12" 
                opacity="0.6"
                filter="url(#wood-texture)"
              />
              
              {/* Inner hexagonal border */}
              <polygon 
                points={mapSize === 2 
                  ? "0,-147 126,-73.5 126,73.5 0,147 -126,73.5 -126,-73.5"
                  : mapSize === 3
                  ? "0,-220.5 189,-110.25 189,110.25 0,220.5 -189,110.25 -189,-110.25"
                  : "0,-294 252,-147 252,147 0,294 -252,147 -252,-147"
                }
                fill="none" 
                stroke="#DAA520" 
                strokeWidth="3" 
                opacity="0.8"
              />
              
              {/* Title */}
              <text x="0" y={mapSize === 2 ? "-190" : mapSize === 3 ? "-250" : "-330"} 
                    textAnchor="middle" fontSize="18" fill="#DAA520" fontWeight="bold" opacity="0.8">
                CATAN ISLAND
              </text>
              
              {/* Render all hexes */}
              {hexes.map(hex => {
                const { x, y } = hexToPixel(hex.q, hex.r);
                const key = `${hex.q},${hex.r}`;
                const placedHex = board.get(key);
                const number = boardNumbers.get(key);
                
                return (
                  <TerrainTile
                    key={key}
                    x={x}
                    y={y}
                    terrain={placedHex?.terrain || (hex.isWater ? 'water' : undefined)}
                    hasSettlement={placedHex?.hasSettlement}
                    hasCity={placedHex?.hasCity}
                    number={!hex.isWater && placedHex?.terrain && placedHex.terrain !== 'desert' && placedHex.terrain !== 'water' && placedHex.terrain !== 'gold' ? number : undefined}
                    onClick={() => handleBoardClick(hex.q, hex.r)}
                  />
                );
              })}
              
              {/* Render falling tile */}
              {currentTile && isPlaying && !showFinalBoard && (
                <FallingTile
                  x={hexToPixel(tilePosition.q, tilePosition.r).x}
                  y={hexToPixel(tilePosition.q, tilePosition.r).y}
                  terrain={currentTile}
                  rotation={tileRotation}
                />
              )}
              
              {/* Add proper harbors at board edges - positioned just outside the board */}
              {mapSize === 2 && (
                <g opacity="0.9">
                  {/* 3:1 Generic harbors - positioned just outside */}
                  <g transform="translate(-78, -135)">
                    <rect x="-18" y="-9" width="36" height="18" fill="#8B4513" rx="4" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="12" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  <g transform="translate(78, -135)">
                    <rect x="-18" y="-9" width="36" height="18" fill="#8B4513" rx="4" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="12" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  <g transform="translate(156, 0)">
                    <rect x="-18" y="-9" width="36" height="18" fill="#8B4513" rx="4" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="12" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  <g transform="translate(-156, 0)">
                    <rect x="-18" y="-9" width="36" height="18" fill="#8B4513" rx="4" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="12" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  
                  {/* 2:1 Specialized harbors - positioned just outside */}
                  <g transform="translate(0, -165)">
                    <rect x="-22" y="-9" width="44" height="18" fill="#228B22" rx="4" stroke="#1a5c1a" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="11" fill="#FFD700" fontWeight="bold">2:1 🌲</text>
                  </g>
                  <g transform="translate(117, -82)">
                    <rect x="-22" y="-9" width="44" height="18" fill="#F4A460" rx="4" stroke="#D2691E" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="11" fill="#333" fontWeight="bold">2:1 🌾</text>
                  </g>
                  <g transform="translate(117, 82)">
                    <rect x="-22" y="-9" width="44" height="18" fill="#696969" rx="4" stroke="#4a4a4a" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="11" fill="#FFD700" fontWeight="bold">2:1 ⛏️</text>
                  </g>
                  <g transform="translate(0, 165)">
                    <rect x="-22" y="-9" width="44" height="18" fill="#90EE90" rx="4" stroke="#66bb66" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="11" fill="#333" fontWeight="bold">2:1 🐑</text>
                  </g>
                  <g transform="translate(-117, 82)">
                    <rect x="-22" y="-9" width="44" height="18" fill="#A0522D" rx="4" stroke="#8B4513" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="11" fill="#FFD700" fontWeight="bold">2:1 🧱</text>
                  </g>
                </g>
              )}
            </svg>
            
            {/* Controls instruction - mobile responsive */}
            {isPlaying && !showFinalBoard && (
              <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 text-xs sm:text-sm text-muted-foreground bg-card/90 p-2 sm:p-3 rounded-lg backdrop-blur-sm border border-border/30 max-w-[250px] sm:max-w-none">
                <div className="font-semibold text-foreground mb-1">Controls:</div>
                <div className="hidden sm:block">
                  <div>← → : Move tile left/right</div>
                  <div>↓ : Speed up drop</div>
                  <div>↑ : Rotate tile (visual only)</div>
                  <div>SPACE : Hard drop (instant place)</div>
                  <div>Click : Move tile to position</div>
                </div>
                <div className="sm:hidden">
                  <div>Tap board to move tile</div>
                  <div>Tiles reset if blocked</div>
                </div>
              </div>
            )}

            {/* Game Over - Mobile Responsive */}
            {showFinalBoard && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <Card className="p-4 sm:p-6 text-center border-2 border-primary/50 bg-card/90 backdrop-blur-sm max-w-[90vw] sm:max-w-md">
                  <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">🏝️ Island Complete! 🏝️</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Your Catan island is ready!</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">Number tokens have been placed on the tiles.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => {
                      setShowFinalBoard(false);
                      if (!hasMoreTiles) {
                        onGameEnd?.();
                      }
                    }}
                  >
                    View Board
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Side Panel */}
      <div className="lg:col-span-1 order-1 lg:order-2 space-y-4">
        {/* Next Tile Preview */}
        <NextTilePreview nextTile={nextTile} upcomingTiles={upcomingTiles} />
        
        {/* Remaining Tiles Counter */}
        <Card className="bg-card/60 backdrop-blur-sm border-border/30">
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
    </div>
  );
};