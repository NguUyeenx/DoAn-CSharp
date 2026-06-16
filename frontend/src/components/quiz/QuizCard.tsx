import type { QuizQuestion, QuizResult } from '@/types/api';
import { useTranslation } from 'react-i18next';

interface QuizCardProps {
  question: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  disabled: boolean;
  result?: QuizResult | null;
}

export default function QuizCard({
  question,
  currentIndex,
  totalQuestions,
  selectedOption,
  onSelectOption,
  disabled,
  result,
}: QuizCardProps) {
  const { t } = useTranslation();

  const options = [
    { key: 'A', text: question.answerA },
    { key: 'B', text: question.answerB },
    { key: 'C', text: question.answerC },
    { key: 'D', text: question.answerD },
  ].filter(opt => opt.text); // Only show options that have text

  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="w-full bg-card border border-border rounded-2xl shadow-md p-5 sm:p-6 flex flex-col gap-5">
      {/* Progress Bar & Header */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-bold text-text-muted">
          <span className="uppercase tracking-wider">
            {t('quiz.progress', 'Câu hỏi {{current}} / {{total}}', {
              current: currentIndex + 1,
              total: totalQuestions,
            })}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-alt rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Text */}
      <h3 className="font-display font-extrabold text-base sm:text-lg text-text-primary leading-snug">
        {question.questionText}
      </h3>

      {/* Options Grid */}
      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key;

          let btnClass = 'border-border bg-card text-text-secondary hover:border-border-hover hover:text-text-primary active:scale-[0.99]';
          let indicatorClass = 'bg-surface-alt border-border text-text-muted';

          if (result) {
            const isCorrectOption = result.correctOption === opt.key;
            if (isCorrectOption) {
              btnClass = 'border-accent bg-accent/5 text-accent font-semibold';
              indicatorClass = 'bg-accent border-accent text-white';
            } else if (isSelected) {
              btnClass = 'border-danger bg-danger/5 text-danger font-semibold';
              indicatorClass = 'bg-danger border-danger text-white';
            } else {
              btnClass = 'border-border bg-card text-text-muted opacity-50';
              indicatorClass = 'bg-surface-alt border-border text-text-muted';
            }
          } else if (isSelected) {
            btnClass = 'border-primary bg-primary/5 text-primary font-semibold';
            indicatorClass = 'bg-primary border-primary text-white';
          }

          return (
            <button
              key={opt.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOption(opt.key)}
              className={`
                w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3.5 outline-none select-none cursor-pointer
                ${btnClass}
              `}
            >
              {/* Option Letter Indicator */}
              <div
                className={`
                  w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-display font-extrabold text-xs border-2
                  ${indicatorClass}
                `}
              >
                {opt.key}
              </div>
              <span className="text-xs sm:text-sm leading-relaxed">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
