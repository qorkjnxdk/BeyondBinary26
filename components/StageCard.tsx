'use client';

import { useRouter } from 'next/navigation';

interface StageContent {
  stage: number;
  title: string;
  tagline: string;
  age_range: string;
  milestones: string[];
  challenges: string[];
  look_forward: string[];
  journal_prompts: string[];
}

interface StageCardProps {
  stage: StageContent;
  isCurrent: boolean;
  isCompleted: boolean;
}

export default function StageCard({ stage, isCurrent, isCompleted }: StageCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
      {/* Header */}
      <div
        className={`p-6 ${
          isCurrent
            ? 'bg-gradient-to-r from-primary-50 to-accent-50 border-b border-primary-100'
            : isCompleted
            ? 'bg-green-50 border-b border-green-100'
            : 'bg-gray-50 border-b border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-gray-800">{stage.title}</h3>
              {isCurrent && (
                <span className="px-3 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full">
                  Current Stage
                </span>
              )}
              {isCompleted && (
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                  Completed
                </span>
              )}
            </div>
            <p className="text-gray-600 italic">{stage.tagline}</p>
            <p className="text-sm text-gray-500 mt-1">{stage.age_range}</p>
          </div>
        </div>
      </div>

      {/* Content sections - 3 column layout */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* What's Happening Now */}
          <div>
            <h4 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
              What's Happening Now
            </h4>
            <ul className="space-y-1.5">
              {stage.milestones.map((milestone, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                  <span className="text-primary-500 font-bold text-[10px] mt-0.5">•</span>
                  <span>{milestone}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Common Challenges */}
          <div>
            <h4 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
              Common Challenges
            </h4>
            <ul className="space-y-1.5">
              {stage.challenges.map((challenge, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                  <span className="text-accent-500 font-bold text-[10px] mt-0.5">•</span>
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Things to Look Forward To */}
          <div>
            <h4 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
              Things to Look Forward To
            </h4>
            <ul className="space-y-1.5">
              {stage.look_forward.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                  <span className="text-green-500 font-bold text-[10px] mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
