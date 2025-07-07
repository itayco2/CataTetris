import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TerrainTile } from './TerrainTile';
import { FallingTile } from './FallingTile';
import { NextTilePreview } from './NextTilePreview';
import { useTileQueue } from '@/hooks/useTileQueue';
import { TileCount } from './GameModeSelector';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
    } else if (size === 4) {
      // Large Seafarers map (61 tiles for better gameplay)
      const landHexes = [];
      for (let q = -4; q <= 4; q++) {
        const r1 = Math.max(-4, -q - 4);
        const r2 = Math.min(4, -q + 4);
        for (let r = r1; r <= r2; r++) {
          const s = -q - r;
          if (Math.abs(q) <= 4 && Math.abs(r) <= 4 && Math.abs(s) <= 4) {
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
    // Return spawn positions for each valid column, 2 rows above the board (lowered from 4)
    return Array.from(validColumns).map(q => ({
      q,
      r: topRow - 2
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
    
    // Check if position already has a tile - if so, reset to top
    if (board.has(key) && board.get(key)?.terrain) {
      spawnNewTile();
      return;
    }
    
    // Create new board with the placed tile
    const newBoard = new Map(board);
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
    } else {
      // No more tiles - this was the last tile!
      // Use the new board directly for number generation
      setTimeout(() => {
        // Generate numbers using the new board that includes the last tile
        const numberTiles = [];
        newBoard.forEach((hex, hexKey) => {
          // Exclude only desert and water from getting numbers - gold DOES get numbers
          if (hex.terrain && hex.terrain !== 'desert' && hex.terrain !== 'water') {
            numberTiles.push({ key: hexKey, q: hex.q, r: hex.r });
          }
        });
        
        // Calculate how many numbers we actually need
        const numbersNeeded = numberTiles.length;
        
        // Generate appropriate number distribution based on actual tiles that need numbers
        let numberDistribution: number[] = [];
        
        if (mapSize === 2) {
          // Base game: should have exactly 18 resource tiles (19 total - 1 desert)
          numberDistribution = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
        } else {
          // For larger maps, generate numbers based on how many we actually need
          const baseNumbers = [2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12];
          numberDistribution = [...baseNumbers];
          
          // Add more numbers if needed
          while (numberDistribution.length < numbersNeeded) {
            // Add balanced numbers (avoiding 7)
            const additionalNumbers = [3, 4, 5, 6, 8, 9, 10, 11];
            for (const num of additionalNumbers) {
              if (numberDistribution.length < numbersNeeded) {
                numberDistribution.push(num);
              }
            }
          }
        }
        
        // Ensure we have exactly the right amount of numbers
        numberDistribution = numberDistribution.slice(0, numbersNeeded);
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
        
        const isValidPlacement = (tileKey: string, number: number, placedNumbers: Map<string, number>) => {
          if (number !== 6 && number !== 8) return true;
          const tile = numberTiles.find(t => t.key === tileKey);
          if (!tile) return false;
          
          const adjacentHexes = getAdjacentHexes(tile.q, tile.r);
          for (const adj of adjacentHexes) {
            const adjKey = `${adj.q},${adj.r}`;
            const adjNumber = placedNumbers.get(adjKey);
            if (adjNumber === 6 || adjNumber === 8) {
              return false;
            }
          }
          return true;
        };
        
        // Place numbers
        const highProbNumbers = numberDistribution.filter(n => n === 6 || n === 8);
        const otherNumbers = numberDistribution.filter(n => n !== 6 && n !== 8);
        
        const newNumbers = new Map<string, number>();
        const availableTiles = [...numberTiles];
        
        // Place 6s and 8s
        for (const number of highProbNumbers) {
          let placed = false;
          for (let attempts = 0; attempts < 100 && !placed; attempts++) {
            const randomIndex = Math.floor(Math.random() * availableTiles.length);
            const tile = availableTiles[randomIndex];
            
            if (isValidPlacement(tile.key, number, newNumbers)) {
              newNumbers.set(tile.key, number);
              availableTiles.splice(randomIndex, 1);
              placed = true;
            }
          }
          
          if (!placed && availableTiles.length > 0) {
            const tile = availableTiles.shift();
            if (tile) newNumbers.set(tile.key, number);
          }
        }
        
        // Place other numbers
        const shuffledOthers = [...otherNumbers].sort(() => Math.random() - 0.5);
        for (let i = 0; i < availableTiles.length && i < shuffledOthers.length; i++) {
          const tile = availableTiles[i];
          const number = shuffledOthers[i];
          newNumbers.set(tile.key, number);
        }
        
        // Safety check: ensure all resource tiles get a number
        // This handles edge cases where the last tile might not get a number
        numberTiles.forEach(tile => {
          if (!newNumbers.has(tile.key)) {
            // Find an available number from the remaining distribution
            const usedNumbers = Array.from(newNumbers.values());
            const remainingNumbers = numberDistribution.filter((num, index) => {
              const usedCount = usedNumbers.filter(n => n === num).length;
              const availableCount = numberDistribution.filter(n => n === num).length;
              return usedCount < availableCount;
            });
            
            if (remainingNumbers.length > 0) {
              // Pick a random remaining number
              const randomNumber = remainingNumbers[Math.floor(Math.random() * remainingNumbers.length)];
              newNumbers.set(tile.key, randomNumber);
            } else {
              // Fallback: use any reasonable number if we somehow run out
              const fallbackNumbers = [3, 4, 5, 9, 10, 11];
              const randomFallback = fallbackNumbers[Math.floor(Math.random() * fallbackNumbers.length)];
              newNumbers.set(tile.key, randomFallback);
            }
          }
        });
        
        setBoardNumbers(newNumbers);
        setShowFinalBoard(true);
        onGameEnd?.();
      }, 500);
    }
  }, [currentTile, board, onTilePlaced, getNextTile, spawnNewTile, onGameEnd, mapSize]);

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

  // Mobile specific adjustments
  const svgViewBox = isMobile 
    ? mapSize === 2 ? "-200 -230 400 460" 
    : mapSize === 3 ? "-280 -320 560 640" 
    : mapSize === 4 ? "-350 -400 700 800"
    : "-360 -400 720 800"
    : mapSize === 2 ? "-250 -280 500 560" 
    : mapSize === 3 ? "-350 -380 700 760" 
    : mapSize === 4 ? "-450 -480 900 960"
    : "-450 -480 900 960";

  // ========== RENDER ==========
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
      {/* Game Board */}
      <div className="lg:col-span-3 order-2 lg:order-1">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-border/50 shadow-2xl min-h-[350px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] h-full">
          {/* Ocean background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-blue-800/10 to-blue-700/10"></div>
          
          {/* Catan Board Frame */}
          <div className="absolute inset-2 sm:inset-3 md:inset-4 rounded-lg border-2 sm:border-3 md:border-4 border-amber-600/40 bg-gradient-to-br from-amber-900/5 to-amber-800/5 shadow-inner">
            {/* Decorative corner elements */}
            <div className="absolute top-1 left-1 sm:top-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-amber-500/60"></div>
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-amber-500/60"></div>
            <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-amber-500/60"></div>
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-amber-500/60"></div>
          </div>
          
          <div className="relative w-full h-full flex items-center justify-center p-1 sm:p-2 md:p-4 lg:p-8">
            <svg 
              viewBox={svgViewBox}
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
                  : mapSize === 4
                  ? "0,-308 266,-154 266,154 0,308 -266,154 -266,-154"
                  : "0,-308 266,-154 266,154 0,308 -266,154 -266,-154"
                }
                fill="none" 
                stroke="url(#board-frame)" 
                strokeWidth={isMobile ? "8" : "12"} 
                opacity="0.6"
                filter="url(#wood-texture)"
              />
              
              {/* Inner hexagonal border */}
              <polygon 
                points={mapSize === 2 
                  ? "0,-147 126,-73.5 126,73.5 0,147 -126,73.5 -126,-73.5"
                  : mapSize === 3
                  ? "0,-220.5 189,-110.25 189,110.25 0,220.5 -189,110.25 -189,-110.25"
                  : mapSize === 4
                  ? "0,-294 252,-147 252,147 0,294 -252,147 -252,-147"
                  : "0,-294 252,-147 252,147 0,294 -252,147 -252,-147"
                }
                fill="none" 
                stroke="#DAA520" 
                strokeWidth={isMobile ? "2" : "3"} 
                opacity="0.8"
              />
              
              {/* Title - Hidden on mobile */}
              {!isMobile && (
                <text x="0" y={mapSize === 2 ? "-190" : mapSize === 3 ? "-250" : mapSize === 4 ? "-330" : "-330"} 
                      textAnchor="middle" fontSize="18" fill="#DAA520" fontWeight="bold" opacity="0.8">
                  CATAN ISLAND
                </text>
              )}
              
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
                    number={!hex.isWater && placedHex?.terrain && placedHex.terrain !== 'desert' && placedHex.terrain !== 'water' ? number : undefined}
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
            </svg>
            
            {/* Controls instruction - mobile responsive */}
            {isPlaying && !showFinalBoard && (
              <div className={`absolute ${isMobile ? 'bottom-1 left-1 right-1' : 'bottom-2 left-2 sm:bottom-4 sm:left-4'} text-xs sm:text-sm text-muted-foreground bg-card/90 p-1 sm:p-2 md:p-3 rounded-lg backdrop-blur-sm border border-border/30 ${isMobile ? 'text-center' : 'max-w-[250px] sm:max-w-none'}`}>
                {isMobile ? (
                  <div>Tap board to move tile • Tiles auto-drop</div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}

            {/* Game Over - Mobile Responsive */}
            {showFinalBoard && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                <Card className="p-3 sm:p-4 md:p-6 text-center border-2 border-primary/50 bg-card/90 backdrop-blur-sm w-[90%] max-w-[90vw] sm:max-w-md">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-1 sm:mb-2">🏝️ Island Complete! 🏝️</h2>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Your Catan island is ready!</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-1 sm:mt-2">Number tokens have been placed on the tiles.</p>
                  <Button 
                    className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base" 
                    size={isMobile ? "sm" : "default"}
                    onClick={() => {
                      setShowFinalBoard(false);
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

      {/* Side Panel - Responsive */}
      <div className="lg:col-span-1 order-1 lg:order-2 space-y-2 sm:space-y-3 md:space-y-4">
        {/* Next Tile Preview */}
        <NextTilePreview nextTile={nextTile} upcomingTiles={upcomingTiles} />
        
        {/* Remaining Tiles Counter - Compact on mobile */}
        <Card className="bg-card/60 backdrop-blur-sm border-border/30">
          <div className="p-2 sm:p-3 md:p-4">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2">Remaining Tiles</h3>
            <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-2'} gap-0.5 sm:gap-1 text-[10px] sm:text-xs`}>
              {Object.entries(remainingTiles).map(([terrain, count]) => (
                count > 0 && (
                  <div key={terrain} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">{isMobile ? terrain.slice(0, 3) : terrain}:</span>
                    <span className="text-foreground font-medium">{count}</span>
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