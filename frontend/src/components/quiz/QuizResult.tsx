import type { QuizResult as QuizResultType } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, ChevronRight, Check } from 'lucide-react';

interface QuizResultProps {
  result: QuizResultType;
  selectedOption: string;
  onNext: () => void;
  isLastQuestion: boolean;
}

export default function QuizResult({
  result,
  selectedOption,
  onNext,
  isLastQuestion,
}: QuizResultProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`
        w-full border rounded-2xl shadow-lg p-5 sm:p-6 flex flex-col gap-4 animate-scale-in
        ${
          result.isCorrect
            ? 'bg-accent/5 border-accent/30 text-text-primary'
            : 'bg-danger/5 border-danger/30 text-text-primary'
        }
      `}
    >
      {/* Result Status Header */}
      <div className="flex items-center gap-2.5">
        {result.isCorrect ? (
          <>
            <CheckCircle2 className="text-accent shrink-0" size={24} />
            <h4 className="font-display font-extrabold text-base text-accent">
              {t('quiz.correct', 'Chính xác!')}
            </h4>
          </>
        ) : (
          <>
            <XCircle className="text-danger shrink-0" size={24} />
            <h4 className="font-display font-extrabold text-base text-danger">
              {t('quiz.incorrect', 'Chưa đúng rồi!')}
            </h4>
          </>
        )}
      </div>

      {/* Answer detail report */}
      <div className="text-xs sm:text-sm space-y-2">
        <p className="font-medium text-text-secondary">
          {t('quiz.yourAnswer', 'Bạn chọn:')}{' '}
          <span className="font-bold text-text-primary">{selectedOption}</span>
        </p>
        {!result.isCorrect && (
          <p className="font-medium text-accent flex items-center gap-1">
            <Check size={14} className="stroke-[3px]" />
            <span>
              {t('quiz.correctAnswer', 'Đáp án đúng là:')}{' '}
              <span className="font-bold uppercase">{result.correctOption}</span>
            </span>
          </p>
        )}
        
        {/* Explanation text */}
        {result.explanationText && (
          <div className="mt-3 bg-card/60 p-3 rounded-lg border border-border/40 text-xs sm:text-sm text-text-secondary leading-relaxed">
            <span className="font-bold text-text-primary block mb-0.5">{t('quiz.explanation', 'Giải thích:')}</span>
            {result.explanationText}
          </div>
        )}
      </div>

      {/* Action button */}
      <button
        type="button"
        onClick={onNext}
        className={`
          mt-2 h-10 w-full rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 outline-none cursor-pointer
          ${result.isCorrect ? 'bg-accent hover:opacity-90' : 'bg-danger hover:opacity-90'}
        `}
      >
        <span>
          {isLastQuestion ? t('quiz.finish', 'Hoàn thành') : t('quiz.next', 'Câu hỏi tiếp theo')}
        </span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
