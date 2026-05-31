import { motion } from 'framer-motion';
import { Award, Zap, CheckCircle2, RotateCcw } from 'lucide-react';
import { useGamificationStore, BADGES } from '../stores/gamificationStore';
import { useSettingsStore } from '../stores/settingsStore';

export default function ProfilePage() {
  const language = useSettingsStore((state) => state.language);
  const { 
    points, 
    visitedPoiIds, 
    completedTourIds, 
    solvedQuizIds, 
    correctQuizzesCount, 
    unlockedBadges, 
    resetGamification 
  } = useGamificationStore();

  // Level computation: 300 points per level
  const pointsPerLevel = 300;
  const currentLevel = Math.floor(points / pointsPerLevel) + 1;
  const currentLevelMin = (currentLevel - 1) * pointsPerLevel;
  const pointsInCurrentLevel = points - currentLevelMin;
  const levelProgressPercent = Math.min((pointsInCurrentLevel / pointsPerLevel) * 100, 100);

  const handleReset = () => {
    const confirmMsg = language === 'vi'
      ? 'Bạn có chắc chắn muốn đặt lại toàn bộ điểm số, lịch sử check-in và huy chương đã mở khóa không?'
      : 'Are you sure you want to reset all your points, check-in history, and unlocked badges?';
    
    if (window.confirm(confirmMsg)) {
      resetGamification();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="p-6 max-w-lg mx-auto text-white flex flex-col gap-6 min-h-[calc(100vh-64px)] pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-zinc-900 pb-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'vi' ? 'Hồ sơ cá nhân' : 'Explorer Profile'}
        </h1>
        <p className="text-xs text-zinc-400">
          {language === 'vi'
            ? 'Theo dõi thành tích khám phá ẩm thực và giải đố văn hóa của bạn.'
            : 'Track your culinary street exploration progress and cultural achievements.'}
        </p>
      </div>

      {/* Level Card */}
      <div className="relative p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md overflow-hidden flex flex-col gap-4 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
              {language === 'vi' ? 'Cấp Độ Nhà Thám Hiểm' : 'Explorer Level'}
            </span>
            <h2 className="text-2xl font-black text-zinc-150">
              {language === 'vi' ? `Cấp độ ${currentLevel}` : `Level ${currentLevel}`}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-2xl shadow">
            🧭
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-semibold text-zinc-400">
            <span>{pointsInCurrentLevel} / {pointsPerLevel} XP</span>
            <span>{Math.round(levelProgressPercent)}%</span>
          </div>
          <div className="w-full h-3.5 bg-zinc-900 rounded-full border border-zinc-850 p-0.5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${levelProgressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
          <Zap className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            {language === 'vi'
              ? `Tích lũy ${pointsPerLevel - pointsInCurrentLevel} điểm nữa để lên cấp tiếp theo.`
              : `Earn ${pointsPerLevel - pointsInCurrentLevel} more points to reach Level ${currentLevel + 1}.`}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3"
      >
        <motion.div 
          variants={itemVariants}
          className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col gap-1 shadow-sm"
        >
          <span className="text-xl">🏆</span>
          <span className="text-lg font-black text-zinc-100">{points}</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
            {language === 'vi' ? 'Tổng Điểm XP' : 'Total Score'}
          </span>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col gap-1 shadow-sm"
        >
          <span className="text-xl">📍</span>
          <span className="text-lg font-black text-zinc-100">{visitedPoiIds.length}</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
            {language === 'vi' ? 'Điểm Đã Ghé Thăm' : 'Spots Visited'}
          </span>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col gap-1 shadow-sm"
        >
          <span className="text-xl">🎓</span>
          <span className="text-lg font-black text-zinc-100">{correctQuizzesCount} / {solvedQuizIds.length}</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
            {language === 'vi' ? 'Giải Đúng Câu Đố' : 'Quizzes Solved'}
          </span>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col gap-1 shadow-sm"
        >
          <span className="text-xl">🚶‍♂️</span>
          <span className="text-lg font-black text-zinc-100">{completedTourIds.length}</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
            {language === 'vi' ? 'Hành Trình Hoàn Thành' : 'Tours Completed'}
          </span>
        </motion.div>
      </motion.div>

      {/* Badges Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-base">
            {language === 'vi' ? 'Huy chương đạt được' : 'Unlocked Badges'}
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          {BADGES.map((badge) => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            return (
              <div 
                key={badge.id}
                className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                  isUnlocked 
                    ? 'bg-zinc-900/60 border-zinc-800 shadow-md' 
                    : 'bg-zinc-950/40 border-zinc-900/50 opacity-40'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow shrink-0 ${
                  isUnlocked ? 'bg-zinc-800 border border-zinc-700/50' : 'bg-zinc-900 border border-zinc-850'
                }`}>
                  {badge.icon}
                </div>
                <div className="flex-1 flex flex-col justify-center text-left">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isUnlocked ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {language === 'vi' ? badge.nameVi : badge.nameEn}
                    </span>
                    {isUnlocked && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </div>
                  <span className="text-xs text-zinc-400 mt-0.5 leading-relaxed font-normal">
                    {language === 'vi' ? badge.descriptionVi : badge.descriptionEn}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Progress Button */}
      <button
        onClick={handleReset}
        className="flex items-center justify-center gap-2 w-full py-3 bg-red-950/15 border border-red-950 hover:bg-red-950/30 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 transition-colors mt-4"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>{language === 'vi' ? 'Đặt Lại Tiến Trình' : 'Reset My Progress'}</span>
      </button>
    </div>
  );
}
