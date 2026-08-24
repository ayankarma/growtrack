/**
 * Maps growth_stage values to emoji representations.
 * Will be replaced with pixel-art sprites in a future phase.
 */
const STAGE_MAP = {
  empty:         { emoji: '🟫', label: 'Empty Plot' },
  seed:          { emoji: '🫘', label: 'Seed' },
  sprout:        { emoji: '🌱', label: 'Sprout' },
  bud:           { emoji: '🌿', label: 'Bud' },
  bloom:         { emoji: '🌸', label: 'Bloom' },
  sapling:       { emoji: '🌾', label: 'Sapling' },
  young_tree:    { emoji: '🪴', label: 'Young Tree' },
  mature_tree:   { emoji: '🌳', label: 'Mature Tree' },
  fruiting_tree: { emoji: '🍊', label: 'Fruiting Tree' },
};

export default function GardenGrid({ plots }) {
  if (!plots || plots.length === 0) {
    return (
      <div className="pixel-panel text-center">
        <p className="font-pixel text-xs">Loading garden...</p>
      </div>
    );
  }

  // Sort plots into a 6x6 grid by (y, x)
  const sortedPlots = [...plots].sort((a, b) => {
    if (a.plot_y !== b.plot_y) return a.plot_y - b.plot_y;
    return a.plot_x - b.plot_x;
  });

  return (
    <div className="pixel-panel">
      <h2 className="font-pixel text-sm mb-4 text-center">🌻 Your Garden 🌻</h2>
      <div
        className="grid gap-1 mx-auto"
        style={{
          gridTemplateColumns: 'repeat(6, 1fr)',
          maxWidth: '420px',
        }}
      >
        {sortedPlots.map((plot) => {
          const stageInfo = STAGE_MAP[plot.growth_stage] || STAGE_MAP.empty;
          const hasBirds = plot.birds_visiting;

          return (
            <div
              key={plot.id}
              className="flex flex-col items-center justify-center border-2 border-retro-darkdirt bg-retro-dirt aspect-square cursor-default transition-all hover:scale-105"
              title={`${stageInfo.label}${hasBirds ? ' 🐦 Birds visiting!' : ''}`}
              style={{ minWidth: '56px' }}
            >
              <span className="text-2xl leading-none select-none">
                {stageInfo.emoji}
              </span>
              {hasBirds && (
                <span className="text-xs mt-0.5 leading-none">🐦</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
