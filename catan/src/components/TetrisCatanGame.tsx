import { useState } from 'react';
import { GameModeSelector, GameMode } from './GameModeSelector';
import { GameBoard } from './GameBoard';
import { GameStats } from './GameStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Home } from 'lucide-react';

export const TetrisCatanGame = () => {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [gameStats, setGameStats] = useState({
    resources: { wood: 0, wheat: 0, ore: 0, sheep: 0, brick: 0 },
    victoryPoints: 0,
    targetPoints: 10,
    settlements: 0,
    cities: 0,
    longestRoad: 0
  });

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  const handleStartGame = () => {
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePauseGame = () => {
    setIsPaused(!isPaused);
  };

  const handleResetGame = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setResetTrigger(prev => prev + 1);
    // Reset game state
    setGameStats({
      resources: { wood: 0, wheat: 0, ore: 0, sheep: 0, brick: 0 },
      victoryPoints: 0,
      targetPoints: selectedMode?.name.includes('Seafarers') ? 12 : 10,
      settlements: 0,
      cities: 0,
      longestRoad: 0
    });
  };

  const handleBackToMenu = () => {
    setSelectedMode(null);
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Add this new function to handle game end
  const handleGameEnd = () => {
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Mode selection screen
  if (!selectedMode) {
    return <GameModeSelector onSelectMode={handleModeSelect} />;
  }

  // Game screen
  return (
    <div className="min-h-screen bg-gradient-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-medieval">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-2xl text-primary">
                  Tetris Catan: {selectedMode.name}
                </CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {selectedMode.maxPlayers} Players • Size {selectedMode.mapSize}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                {!isPlaying ? (
                  <Button 
                    variant="medieval" 
                    size="lg" 
                    onClick={handleStartGame}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Game
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="secondary" 
                      onClick={handlePauseGame}
                      className="flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleResetGame}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  onClick={handleBackToMenu}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Menu
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Game Layout */}
        <div className="space-y-6">
          {/* Game Board with integrated layout */}
          <GameBoard 
            mapSize={selectedMode.mapSize} 
            isPlaying={isPlaying && !isPaused} 
            tileCount={selectedMode.tileCount}
            resetTrigger={resetTrigger}
            onGameEnd={handleGameEnd} // Add this prop
            onTilePlaced={(terrain) => {
              // Update game stats when tiles are placed - map terrain to resources
              setGameStats(prev => ({
                ...prev,
                resources: {
                  ...prev.resources,
                  wood: terrain === 'forest' ? prev.resources.wood + 1 : prev.resources.wood,
                  wheat: terrain === 'field' ? prev.resources.wheat + 1 : prev.resources.wheat,
                  ore: terrain === 'mountain' ? prev.resources.ore + 1 : prev.resources.ore,
                  sheep: terrain === 'pasture' ? prev.resources.sheep + 1 : prev.resources.sheep,
                  brick: terrain === 'hill' ? prev.resources.brick + 1 : prev.resources.brick,
                }
              }));
            }}
          />
          
          {/* Stats Panel - moved below board */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <GameStats {...gameStats} />
            </div>
            
            {/* Game Status */}
            <div className="lg:col-span-2">
              {isPlaying && (
                <Card className="bg-card/60 backdrop-blur-sm border-border/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
                          <span className="text-foreground">
                            {isPaused ? 'Game Paused' : 'Game Active'}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          Mode: {selectedMode.name}
                        </div>
                        <div className="text-muted-foreground">
                          Players: {selectedMode.maxPlayers}
                        </div>
                      </div>
                      
                      <div className="text-muted-foreground">
                        Target: {gameStats.targetPoints} Victory Points
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};