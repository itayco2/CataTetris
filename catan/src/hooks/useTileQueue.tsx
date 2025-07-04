import { useState, useEffect, useCallback } from 'react';
import { TerrainType } from '@/components/GameBoard';
import { TileCount } from '@/components/GameModeSelector';

interface UseTileQueueProps {
  tileCount: TileCount;
  isPlaying: boolean;
}

export const useTileQueue = ({ tileCount, isPlaying }: UseTileQueueProps) => {
  const [tileQueue, setTileQueue] = useState<TerrainType[]>([]);
  const [currentTile, setCurrentTile] = useState<TerrainType | null>(null);
  const [nextTile, setNextTile] = useState<TerrainType | null>(null);
  const [remainingTiles, setRemainingTiles] = useState<Record<TerrainType, number>>({
    field: 0,
    forest: 0,
    pasture: 0,
    hill: 0,
    mountain: 0,
    desert: 0,
    water: 0,
    gold: 0
  });

  // Generate tile bag based on game mode
  const generateTileBag = (counts: TileCount): TerrainType[] => {
    const bag: TerrainType[] = [];
    
    // Add tiles based on counts
    for (let i = 0; i < counts.field; i++) bag.push('field');
    for (let i = 0; i < counts.forest; i++) bag.push('forest');
    for (let i = 0; i < counts.pasture; i++) bag.push('pasture');
    for (let i = 0; i < counts.hill; i++) bag.push('hill');
    for (let i = 0; i < counts.mountain; i++) bag.push('mountain');
    for (let i = 0; i < counts.desert; i++) bag.push('desert');
    for (let i = 0; i < counts.water; i++) bag.push('water');
    for (let i = 0; i < counts.gold; i++) bag.push('gold');
    
    // Shuffle the bag
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    
    return bag;
  };

  // Initialize tile queue when starting game
  useEffect(() => {
    if (isPlaying) {
      const newBag = generateTileBag(tileCount);
      setTileQueue(newBag);
      setRemainingTiles({ ...tileCount });
      
      // Set initial tiles
      if (newBag.length > 0) {
        setCurrentTile(newBag[0]);
        setNextTile(newBag.length > 1 ? newBag[1] : null);
      }
    }
  }, [isPlaying, tileCount]);

  // Get next tile from queue
  const getNextTile = (): TerrainType | null => {
    if (tileQueue.length <= 1) return null;
    
    const newQueue = tileQueue.slice(1);
    const newCurrent = tileQueue[1];
    const newNext = newQueue.length > 1 ? newQueue[1] : null;
    
    setTileQueue(newQueue);
    setCurrentTile(newCurrent);
    setNextTile(newNext);
    
    // Update remaining tiles count
    if (currentTile) {
      setRemainingTiles(prev => ({
        ...prev,
        [currentTile]: Math.max(0, prev[currentTile] - 1)
      }));
    }
    
    return newCurrent;
  };

  // Get upcoming tiles for preview
  const getUpcomingTiles = (): TerrainType[] => {
    return tileQueue.slice(2, 5); // Show next 3 tiles after current and next
  };

  // Reset queue function
  const resetQueue = useCallback(() => {
    setTileQueue([]);
    setCurrentTile(null);
    setNextTile(null);
    setRemainingTiles({
      field: 0,
      forest: 0,
      pasture: 0,
      hill: 0,
      mountain: 0,
      desert: 0,
      water: 0,
      gold: 0
    });
  }, []);

  return {
    currentTile,
    nextTile,
    upcomingTiles: getUpcomingTiles(),
    remainingTiles,
    getNextTile,
    hasMoreTiles: tileQueue.length > 1,
    resetQueue
  };
};