'use client';

interface StageContent {
  stage: number;
  title: string;
  age_range: string;
}

interface TimelineProps {
  currentStage: number;
  allStages: StageContent[];
  selectedStage: number | null;
  onStageSelect: (stage: number) => void;
  progressInStage: number;
}

export default function BabyJourneyTimeline({
  currentStage,
  allStages,
  selectedStage,
  onStageSelect,
  progressInStage,
}: TimelineProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Timeline</h3>

      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
            style={{
              width: `${((currentStage + progressInStage / 100) / 6) * 100}%`,
            }}
          />
        </div>

        {/* Stage nodes */}
        <div className="relative flex justify-between">
          {allStages.map((stage) => {
            const isCompleted = stage.stage < currentStage;
            const isCurrent = stage.stage === currentStage;
            const isSelected = stage.stage === selectedStage;
            const isFuture = stage.stage > currentStage;

            return (
              <button
                key={stage.stage}
                onClick={() => onStageSelect(stage.stage)}
                className="flex flex-col items-center group"
              >
                {/* Node circle */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white shadow-md'
                      : isCurrent
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg animate-pulse'
                      : isFuture
                      ? 'bg-white border-2 border-gray-300 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
                  } ${
                    isSelected ? 'ring-4 ring-primary-300' : ''
                  } hover:scale-110 relative z-10`}
                >
                  {isCompleted ? '✓' : stage.stage}
                </div>

                {/* Label */}
                <div className="mt-3 text-center max-w-[100px]">
                  <p className="text-xs font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                    {stage.age_range}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {stage.title}
                  </p>
                </div>

                {/* "You are here" indicator for current stage */}
                {isCurrent && (
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-primary-600">You are here</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
