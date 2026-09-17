import { useToast } from './ToastNotification';

/**
 * Hybrid stage map: Uses actual generated sprites where available, 
 * and falls back to styled emojis for the remaining stages.
 */
const STAGE_MAP = {
  empty: { 
    type: 'emoji', 
    content: '🟫', 
    label: 'Empty Plot' 
  },
  seed: { 
    type: 'sprite', 
    src: '/sprites/seed.jpg', 
    label: 'Seed' 
  },
  sprout: { 
    type: 'sprite', 
    src: '/sprites/sprout.jpg', 
    label: 'Sprout' 
  },
  bud: { 
    type: 'sprite', 
    src: '/sprites/bud.jpg', 
    label: 'Bud' 
  },
  bloom: { 
    type: 'sprite', 
    src: '/sprites/bloom.jpg', 
    label: 'Bloom' 
  },
  sapling: { 
    type: 'sprite', 
    src: '/sprites/sapling.jpg', 
    label: 'Sapling' 
  },
  young_tree: { 
    type: 'sprite', 
    src: '/sprites/young_tree.jpg', 
    label: 'Young Tree' 
  },
  mature_tree: { 
    type: 'emoji', 
    content: '🌳', 
    label: 'Mature Tree' 
  },
  fruiting_tree: { 
    type: 'emoji', 
    content: '🍊', 
    label: 'Fruiting Tree' 
  },
};

export default function GardenGrid({ plots }) {
  if (!plots || plots.length === 0) {
    return (
      <div className="pixel-panel-wood text-center">
        <p className="font-pixel text-xs animate-pulse">Loading garden...</p>
      </div>
    );
  }

  // Sort plots into a 6x6 grid by (y, x)
  const sortedPlots = [...plots].sort((a, b) => {
    if (a.plot_y !== b.plot_y) return a.plot_y - b.plot_y;
    return a.plot_x - b.plot_x;
  });

  return (
    <div className="garden-container">
      <h2 className="font-pixel text-sm mb-4 text-center text-retro-cream" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
        🌻 Your Garden 🌻
      </h2>
      
      <div className="garden-grid mx-auto" style={{ maxWidth: '420px' }}>
        {sortedPlots.map((plot) => {
          const stageInfo = STAGE_MAP[plot.growth_stage] || STAGE_MAP.empty;
          const hasBirds = plot.birds_visiting;
          const hasPlant = plot.habit_id != null;

          return (
            <div
              key={plot.id}
              className={`garden-plot stage-${plot.growth_stage} ${hasPlant ? 'has-plant' : ''}`}
            >
              {/* Plant Visual */}
              {stageInfo.type === 'sprite' ? (
                <img 
                  src={stageInfo.src} 
                  alt={stageInfo.label} 
                  className="plant-sprite pixel-sprite" 
                />
              ) : (
                <span className="plant-emoji select-none">
                  {stageInfo.content}
                </span>
              )}

              {/* Bird Indicator */}
              {hasBirds && (
                <span className="bird-indicator select-none">🐦</span>
              )}

              {/* RPG Tooltip */}
              {hasPlant && (
                <div className="garden-tooltip">
                  <strong className="block text-[#a8e063] mb-1 text-xs">
                    {plot.habit_name}
                  </strong>
                  Stage: {stageInfo.label}<br/>
                  Planted: {new Date(plot.planted_at).toLocaleDateString()}
                  {hasBirds && <><br/><span className="text-[#f5c842]">Birds are visiting!</span></>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
