'use client';

interface ExampleQuestionsProps {
  onQuestionClick: (question: string) => void;
  disabled: boolean;
}

const questions = [
  'Do all garage outlets need GFCI?',
  'What is the max spacing for kitchen counter outlets?',
  'How many outlets are required in a bathroom?',
  'Do outdoor receptacles need to be weather-resistant?',
];

export function ExampleQuestions({ onQuestionClick, disabled }: ExampleQuestionsProps) {
  return (
    <div className="space-y-2">
      {/* Title - Smaller on mobile */}
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 text-center px-2">
        Try one of these common questions:
      </h3>

      {/* Questions - Grid on mobile for better space usage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => onQuestionClick(q)}
            disabled={disabled}
            className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-[11px] sm:text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors border border-blue-200 hover:border-blue-300 text-left shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
