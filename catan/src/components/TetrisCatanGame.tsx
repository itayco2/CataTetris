import { useState } from 'react';
import { GameModeSelector, GameMode } from './GameModeSelector';
import { GameBoard } from './GameBoard';
import { GameStats } from './GameStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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

  // Game screen - Mobile optimized
  return (
    <div className="min-h-screen bg-gradient-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile optimized */}
        <Card className="mb-2 sm:mb-4 md:mb-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-medieval">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <CardTitle className="text-lg sm:text-xl md:text-2xl text-primary">
                  {isMobile ? selectedMode.name.split('(')[0].trim() : `Tetris Catan: ${selectedMode.name}`}
                </CardTitle>
                <Badge variant="secondary" className="text-xs sm:text-sm self-start sm:self-auto">
                  {selectedMode.maxPlayers}P • Size {selectedMode.mapSize}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {!isPlaying ? (
                  <Button 
                    variant="medieval" 
                    size={isMobile ? "sm" : "lg"}
                    onClick={handleStartGame}
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                    Start
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="secondary" 
                      size={isMobile ? "sm" : "default"}
                      onClick={handlePauseGame}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
                    >
                      <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size={isMobile ? "sm" : "default"}
                      onClick={handleResetGame}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
                    >
                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Reset</span>
                    </Button>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  size={isMobile ? "sm" : "default"}
                  onClick={handleBackToMenu}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
                >
                  <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Menu</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Game Layout - Mobile optimized */}
        <div className="space-y-2 sm:space-y-4 md:space-y-6">
          {/* Game Board with integrated layout */}
          <GameBoard 
            mapSize={selectedMode.mapSize} 
            isPlaying={isPlaying && !isPaused} 
            tileCount={selectedMode.tileCount}
            resetTrigger={resetTrigger}
            onGameEnd={handleGameEnd}
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
          
          {/* Stats Panel - Hidden on mobile during active gameplay */}
          {(!isMobile || !isPlaying) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
              <div className="lg:col-span-1">
                <GameStats {...gameStats} />
              </div>
              
              {/* Game Status */}
              <div className="lg:col-span-2">
                {isPlaying && (
                  <Card className="bg-card/60 backdrop-blur-sm border-border/30">
                    <CardContent className="p-2 sm:p-3 md:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
                            <span className="text-foreground">
                              {isPaused ? 'Paused' : 'Active'}
                            </span>
                          </div>
                          <div className="text-muted-foreground hidden sm:block">
                            Mode: {selectedMode.name}
                          </div>
                        </div>
                        
                        <div className="text-muted-foreground">
                          Target: {gameStats.targetPoints} VP
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};