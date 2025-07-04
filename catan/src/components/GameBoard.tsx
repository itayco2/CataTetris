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
      // Classic Catan island shape - perfect hexagon
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
      
      // Perfect hexagonal ocean border
      const waterHexes = [
        // Complete outer ring
        { q: 3, r: 0 }, { q: 3, r: -1 }, { q: 3, r: -2 }, { q: 3, r: -3 },
        { q: 2, r: -3 }, { q: 1, r: -3 }, { q: 0, r: -3 }, { q: -1, r: -2 },
        { q: -2, r: -1 }, { q: -3, r: 0 }, { q: -3, r: 1 }, { q: -3, r: 2 },
        { q: -3, r: 3 }, { q: -2, r: 3 }, { q: -1, r: 3 }, { q: 0, r: 3 },
        { q: 1, r: 2 }, { q: 2, r: 1 }
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
      // Extended hexagon for 5-6 players
      const landHexes = [];
      // Generate perfect hexagon with radius 3
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
      
      // Ocean border - one ring outside the land
      const waterHexes = [];
      for (let q = -4; q <= 4; q++) {
        const r1 = Math.max(-4, -q - 4);
        const r2 = Math.min(4, -q + 4);
        for (let r = r1; r <= r2; r++) {
          const s = -q - r;
          const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
          if (distance === 4) {
            waterHexes.push({ q, r });
          }
        }
      }
      
      landHexes.forEach(hex => {
        hexes.push({ ...hex, terrain: undefined });
      });
      
      waterHexes.forEach(hex => {
        hexes.push({ ...hex, terrain: 'water', isWater: true });
      });
    } else {
      // Fallback for other sizes
      for (let q = -size; q <= size; q++) {
        const r1 = Math.max(-size, -q - size);
        const r2 = Math.min(size, -q + size);
        for (let r = r1; r <= r2; r++) {
          const s = -q - r;
          const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
          
          if (distance < size) {
            hexes.push({ q, r, terrain: undefined });
          } else if (distance === size) {
            hexes.push({ q, r, terrain: 'water', isWater: true });
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
        numberTiles.push(key);
      }
    });
    
    // Shuffle the tiles randomly
    const shuffledTiles = [...numberTiles].sort(() => Math.random() - 0.5);
    
    // Take only as many numbers as we have tiles
    const numbersToUse = numberDistribution.slice(0, shuffledTiles.length);
    
    // Shuffle numbers randomly
    const shuffledNumbers = [...numbersToUse].sort(() => Math.random() - 0.5);
    
    const newNumbers = new Map<string, number>();
    
    // Assign numbers to tiles
    shuffledTiles.forEach((tileKey, index) => {
      if (index < shuffledNumbers.length) {
        newNumbers.set(tileKey, shuffledNumbers[index]);
      }
    });
    
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
    // Start 3 rows above the actual board for more reaction time
    return landHexes.filter(h => h.r === topRow).map(h => ({
      ...h,
      r: h.r - 3
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
      // No more tiles - end game
      setShowFinalBoard(true);
      generateNumberTokens();
    }
  }, [currentTile, board, onTilePlaced, getNextTile, spawnNewTile, hasMoreTiles, showFinalBoard, generateNumberTokens]);

  // ========== AUTO DROP ==========
  const autoDropTile = useCallback(() => {
    if (!currentTile || !isPlaying || showFinalBoard) return;
    
    setTilePosition(prev => {
      const newR = prev.r + 1;
      const nextKey = `${prev.q},${newR}`;
      
      // Check if we're still above the board
      const landHexes = hexes.filter(h => !h.isWater);
      const topRow = Math.min(...landHexes.map(h => h.r));
      
      // Always allow movement above the board
      if (newR < topRow) {
        return { ...prev, r: newR };
      }
      
      // Check if valid position on board
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
  }, [currentTile, isPlaying, showFinalBoard, board, placeTile, hexes]);

  // ========== HARD DROP ==========
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
            
            // If above board, allow free movement within reasonable bounds
            if (prev.r < topRow) {
              return Math.abs(newQ) <= mapSize + 2 ? { ...prev, q: newQ } : prev;
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
            
            // If above board, allow free movement within reasonable bounds
            if (prev.r < topRow) {
              return Math.abs(newQ) <= mapSize + 2 ? { ...prev, q: newQ } : prev;
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
    if (!hasMoreTiles && isPlaying && board.size > 0 && !showFinalBoard) {
      // Only end game if we've actually placed some tiles
      setTimeout(() => {
        setShowFinalBoard(true);
        generateNumberTokens();
      }, 500);
    }
  }, [hasMoreTiles, isPlaying, board.size, showFinalBoard, generateNumberTokens]);

  // ========== RENDER ==========
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Game Board */}
      <div className="lg:col-span-3 order-2 lg:order-1">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-border/50 shadow-2xl min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
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
          
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-8">
            <svg 
              viewBox="-300 -350 600 700" 
              className="w-full h-full max-w-[90vw] max-h-[60vh] sm:max-w-[600px] sm:max-h-[600px] md:max-w-[700px] md:max-h-[700px]"
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
                const number = boardNumbers.get(key);
                
                return (
                  <TerrainTile
                    key={key}
                    x={x}
                    y={y}
                    terrain={placedHex?.terrain || (hex.isWater ? 'water' : undefined)}
                    hasSettlement={placedHex?.hasSettlement}
                    hasCity={placedHex?.hasCity}
                    number={showFinalBoard && !hex.isWater && placedHex?.terrain && placedHex.terrain !== 'desert' && placedHex.terrain !== 'water' && placedHex.terrain !== 'gold' ? number : undefined}
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
              
              {/* Add proper harbors at water edges */}
              {mapSize === 2 && (
                <g opacity="0.8">
                  {/* 3:1 Generic harbors - positioned at water hex edges */}
                  <g transform="translate(-105, -180)">
                    <rect x="-15" y="-8" width="30" height="16" fill="#8B4513" rx="4" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="11" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  <g transform="translate(105, -180)">
                    <rect x="-15" y="-8" width="30" height="16" fill="#8B4513" rx="4" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="11" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  <g transform="translate(210, 0)">
                    <rect x="-15" y="-8" width="30" height="16" fill="#8B4513" rx="4" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="11" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  <g transform="translate(-210, 0)">
                    <rect x="-15" y="-8" width="30" height="16" fill="#8B4513" rx="4" stroke="#654321" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="11" fill="#FFD700" fontWeight="bold">3:1</text>
                  </g>
                  
                  {/* 2:1 Specialized harbors */}
                  <g transform="translate(0, -220)">
                    <rect x="-20" y="-8" width="40" height="16" fill="#228B22" rx="4" stroke="#1a5c1a" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="10" fill="#FFD700" fontWeight="bold">2:1 🌲</text>
                  </g>
                  <g transform="translate(157, -110)">
                    <rect x="-20" y="-8" width="40" height="16" fill="#F4A460" rx="4" stroke="#D2691E" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="10" fill="#333" fontWeight="bold">2:1 🌾</text>
                  </g>
                  <g transform="translate(157, 110)">
                    <rect x="-20" y="-8" width="40" height="16" fill="#696969" rx="4" stroke="#4a4a4a" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="10" fill="#FFD700" fontWeight="bold">2:1 ⛏️</text>
                  </g>
                  <g transform="translate(0, 220)">
                    <rect x="-20" y="-8" width="40" height="16" fill="#90EE90" rx="4" stroke="#66bb66" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="10" fill="#333" fontWeight="bold">2:1 🐑</text>
                  </g>
                  <g transform="translate(-157, 110)">
                    <rect x="-20" y="-8" width="40" height="16" fill="#A0522D" rx="4" stroke="#8B4513" strokeWidth="2" />
                    <text x="0" y="2" textAnchor="middle" fontSize="10" fill="#FFD700" fontWeight="bold">2:1 🧱</text>
                  </g>
                </g>
              )}
              
              {/* Catan logo/title in the ocean */}
              <text x="0" y="-260" textAnchor="middle" fontSize="16" fill="#DAA520" fontWeight="bold" opacity="0.8">
                CATAN ISLAND
              </text>
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