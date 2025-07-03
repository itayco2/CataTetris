import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GameStatsProps {
  resources: {
    wood: number;
    wheat: number;
    ore: number;
    sheep: number;
    brick: number;
  };
  victoryPoints: number;
  targetPoints: number;
  settlements: number;
  cities: number;
  longestRoad: number;
}

const RESOURCE_ICONS = {
  wood: '🪵',
  wheat: '🌾',
  ore: '⛏️',
  sheep: '🐑',
  brick: '🧱'
};

const RESOURCE_COLORS = {
  wood: 'bg-terrain-forest',
  wheat: 'bg-terrain-field',
  ore: 'bg-terrain-mountain',
  sheep: 'bg-terrain-pasture',
  brick: 'bg-terrain-hill'
};

export const GameStats = ({ 
  resources, 
  victoryPoints, 
  targetPoints, 
  settlements, 
  cities, 
  longestRoad 
}: GameStatsProps) => {
  const progressPercentage = (victoryPoints / targetPoints) * 100;

  return (
    <div className="space-y-4">
      {/* Victory Points */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-medieval">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary flex items-center justify-between">
            Victory Points
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {victoryPoints}/{targetPoints}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3" />
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {targetPoints - victoryPoints} points to victory
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-medieval">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(resources).map(([resource, count]) => (
              <div key={resource} className="text-center">
                <div className={`w-12 h-12 rounded-lg ${RESOURCE_COLORS[resource as keyof typeof RESOURCE_COLORS]} flex items-center justify-center text-lg mb-1 mx-auto shadow-sm`}>
                  {RESOURCE_ICONS[resource as keyof typeof RESOURCE_ICONS]}
                </div>
                <div className="text-sm font-medium text-foreground">{count}</div>
                <div className="text-xs text-muted-foreground capitalize">{resource}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Buildings */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-medieval">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">Buildings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-600 rounded-full border-2 border-yellow-700"></div>
                <span className="text-sm text-foreground">Settlements</span>
              </div>
              <Badge variant="outline">{settlements}/5</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-600 rounded border-2 border-red-700"></div>
                <span className="text-sm text-foreground">Cities</span>
              </div>
              <Badge variant="outline">{cities}/4</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-2 bg-brown-600 rounded border border-brown-700"></div>
                <span className="text-sm text-foreground">Longest Road</span>
              </div>
              <Badge variant="outline">{longestRoad}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Tile Preview */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-medieval">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">Next Tile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-tile rounded-lg border-2 border-primary/50 flex items-center justify-center text-2xl mb-2 shadow-glow-primary">
              🌲
            </div>
            <div className="text-sm text-muted-foreground">Forest</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};