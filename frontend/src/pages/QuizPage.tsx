import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Award, RefreshCw, MapPin, Loader2, Sparkles } from 'lucide-react';
import { useQuiz } from '@/hooks/useQuiz';
import { poisApi } from '@/api/pois';
import type { POI } from '@/types/poi';
import QuizCard from '@/components/quiz/QuizCard';
import QuizResult from '@/components/quiz/QuizResult';

export default function QuizPage() {
  const { poiId: paramPoiId, slug } = useParams<{ poiId?: string; slug?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [poi, setPoi] = useState<POI | null>(null);
  const [poiLoading, setPoiLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    questions,
    currentQuestionIndex,
    currentQuestion,
    quizResult,
    loading: quizLoading,
    error,
    score,
    completed,
    loadQuiz,
    submitAnswer,
    nextQuestion,
    resetQuiz,
  } = useQuiz();

  // 1. Resolve POI Details & Load Quiz
  useEffect(() => {
    const initializeQuiz = async () => {
      let activePoiId: number | null = null;

      if (paramPoiId) {
        activePoiId = parseInt(paramPoiId, 10);
      }

      setPoiLoading(true);
      try {
        let fetchedPoi: POI | null = null;
        
        if (activePoiId) {
          const { data } = await poisApi.getById(activePoiId, i18n.language);
          fetchedPoi = data;
        } else if (slug) {
          const { data } = await poisApi.getBySlug(slug, i18n.language);
          fetchedPoi = data;
          activePoiId = data.id;
        }

        if (fetchedPoi && activePoiId) {
          setPoi(fetchedPoi);
          await loadQuiz(activePoiId);
        } else {
          throw new Error('POI not found');
        }
      } catch (err) {
        console.error('Failed to initialize quiz:', err);
      } finally {
        setPoiLoading(false);
      }
    };

    initializeQuiz();
  }, [paramPoiId, slug, i18n.language, loadQuiz]);

  const handleSelectOption = async (option: string) => {
    if (quizResult || submitting) return; // Already submitted or loading

    setSelectedOption(option);
    setSubmitting(true);
    await submitAnswer(option);
    setSubmitting(false);
  };

  const handleNext = () => {
    setSelectedOption(null);
    nextQuestion();
  };

  const handleRetry = () => {
    setSelectedOption(null);
    resetQuiz();
  };

  const isLoading = poiLoading || quizLoading;

  if (isLoading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-text-secondary">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold mt-3">{t('quiz.loading', 'Loading quiz challenge...')}</span>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center text-text-secondary gap-4">
        <div className="w-16 h-16 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
          <Award size={28} />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-display font-extrabold text-lg text-text-primary">
            {t('quiz.noQuizTitle', 'No Quiz Available')}
          </h2>
          <p className="text-xs text-text-muted max-w-xs leading-relaxed">
            {t('quiz.noQuizDesc', 'This food spot doesn\'t have a culinary trivia quiz set up yet. Check back soon!')}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer outline-none"
        >
          {t('common.back', 'Back to map')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-12 text-text-primary">
      {/* Quiz Top Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4">
        <button
          onClick={() => navigate(poi ? `/place/${poi.slug}` : '/')}
          className="p-1.5 rounded-full hover:bg-surface-alt text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center min-w-0 flex-1 px-4">
          <span className="text-[10px] uppercase font-bold text-primary tracking-wider font-display block">Culinary Quiz</span>
          <h1 className="font-display font-extrabold text-xs sm:text-sm tracking-tight truncate text-text-primary">
            {poi?.name}
          </h1>
        </div>
        <div className="w-8 h-8" /> {/* Spacer */}
      </header>

      {/* Main Body */}
      <div className="max-w-md mx-auto px-4 mt-6 flex flex-col gap-5">
        {!completed ? (
          /* Active Question Step */
          <>
            {currentQuestion && (
              <QuizCard
                question={currentQuestion}
                currentIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                selectedOption={selectedOption}
                onSelectOption={handleSelectOption}
                disabled={quizResult !== null || submitting}
                result={quizResult}
              />
            )}

            {/* Answer feedback result banner */}
            {quizResult && selectedOption && (
              <QuizResult
                result={quizResult}
                selectedOption={selectedOption}
                onNext={handleNext}
                isLastQuestion={currentQuestionIndex + 1 === questions.length}
              />
            )}
          </>
        ) : (
          /* Quiz Completed Dashboard */
          <div className="w-full bg-card border border-border rounded-2xl shadow-lg p-6 flex flex-col items-center text-center gap-6 relative overflow-hidden animate-scale-in">
            {/* Background Confetti SVG */}
            <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
              <Sparkles size={120} className="text-primary animate-pulse" />
            </div>

            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Award size={32} />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="font-display font-extrabold text-xl text-text-primary">
                {t('quiz.completed', 'Thử thách hoàn thành!')}
              </h2>
              <p className="text-xs text-text-secondary">
                {t('quiz.completedDesc', 'Bạn đã hoàn tất thử thách tìm hiểu văn hóa ẩm thực tại đây.')}
              </p>
            </div>

            {/* Score box */}
            <div className="flex flex-col items-center bg-surface-alt border border-border p-4 rounded-xl min-w-[120px] shadow-inner">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Score</span>
              <span className="text-3xl font-display font-extrabold text-primary">
                {score} / {questions.length}
              </span>
              <span className="text-[10px] font-semibold text-text-secondary mt-1">
                {score === questions.length
                  ? '🏅 Perfect Score!'
                  : score >= questions.length / 2
                  ? '👍 Well Done!'
                  : '😅 Try Again!'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={handleRetry}
                className="h-10 w-full rounded-xl border border-border bg-card hover:bg-surface-alt font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all outline-none cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>{t('quiz.tryAgain', 'Chơi lại')}</span>
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="h-10 w-full rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all outline-none cursor-pointer"
              >
                <MapPin size={14} />
                <span>{t('quiz.exploreMore', 'Khám phá tiếp')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
