import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Badge {
  id: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  icon: string;
}

export const BADGES: Badge[] = [
  {
    id: 'rookie_explorer',
    nameVi: 'Khám Phá Sơ Cấp',
    nameEn: 'Rookie Explorer',
    descriptionVi: 'Ghé thăm địa điểm đầu tiên trên phố Vĩnh Khánh.',
    descriptionEn: 'Visit your very first spot on Vinh Khanh street.',
    icon: '🧭'
  },
  {
    id: 'street_food_critic',
    nameVi: 'Chuyên Gia Ẩm Thực',
    nameEn: 'Street Food Critic',
    descriptionVi: 'Ghé thăm và check-in tại 3 quán ăn khác nhau.',
    descriptionEn: 'Visit and check in at 3 different restaurant spots.',
    icon: '🍴'
  },
  {
    id: 'quiz_master',
    nameVi: 'Bậc Thầy Văn Hóa',
    nameEn: 'Quiz Master',
    descriptionVi: 'Trả lời chính xác 3 câu đố vui ẩm thực.',
    descriptionEn: 'Answer correctly 3 culinary cultural quizzes.',
    icon: '🎓'
  },
  {
    id: 'vinh_khanh_legend',
    nameVi: 'Huyền Thoại Vĩnh Khánh',
    nameEn: 'Vinh Khanh Legend',
    descriptionVi: 'Khám phá và check-in thành công 10 địa điểm khác nhau.',
    descriptionEn: 'Explore and successfully check in at 10 different spots.',
    icon: '👑'
  }
];

interface GamificationState {
  points: number;
  visitedPoiIds: number[];
  visitedPoiCategories: Record<number, string>; // POI ID -> category
  completedTourIds: number[];
  solvedQuizIds: number[];
  correctQuizzesCount: number;
  unlockedBadges: string[];
  
  checkInPoi: (poiId: number, category: string) => { pointsEarned: number; newBadgeUnlocked: boolean };
  completeTour: (tourId: number) => { pointsEarned: number; newBadgeUnlocked: boolean };
  solveQuiz: (quizId: number, isCorrect: boolean) => { pointsEarned: number; newBadgeUnlocked: boolean };
  resetGamification: () => void;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      points: 0,
      visitedPoiIds: [],
      visitedPoiCategories: {},
      completedTourIds: [],
      solvedQuizIds: [],
      correctQuizzesCount: 0,
      unlockedBadges: [],

      checkInPoi: (poiId: number, category: string) => {
        const state = get();
        if (state.visitedPoiIds.includes(poiId)) {
          return { pointsEarned: 0, newBadgeUnlocked: false };
        }

        const newVisitedPois = [...state.visitedPoiIds, poiId];
        const newCategories = { ...state.visitedPoiCategories, [poiId]: category };
        const pointsEarned = 100;
        const currentPoints = state.points + pointsEarned;
        
        // Check achievements
        const newUnlockedBadges = [...state.unlockedBadges];
        
        // 1. Rookie Explorer: visited >= 1
        if (newVisitedPois.length >= 1 && !newUnlockedBadges.includes('rookie_explorer')) {
          newUnlockedBadges.push('rookie_explorer');
        }

        // 2. Street Food Critic: visited 3 restaurants
        const restaurantCount = Object.values(newCategories).filter(
          (cat) => cat === 'restaurant'
        ).length;
        if (restaurantCount >= 3 && !newUnlockedBadges.includes('street_food_critic')) {
          newUnlockedBadges.push('street_food_critic');
        }

        // 3. Vinh Khanh Legend: visited 10 spots
        if (newVisitedPois.length >= 10 && !newUnlockedBadges.includes('vinh_khanh_legend')) {
          newUnlockedBadges.push('vinh_khanh_legend');
        }

        const newBadgeUnlocked = newUnlockedBadges.length > state.unlockedBadges.length;

        set({
          visitedPoiIds: newVisitedPois,
          visitedPoiCategories: newCategories,
          points: currentPoints,
          unlockedBadges: newUnlockedBadges
        });

        return { pointsEarned, newBadgeUnlocked };
      },

      completeTour: (tourId: number) => {
        const state = get();
        if (state.completedTourIds.includes(tourId)) {
          return { pointsEarned: 0, newBadgeUnlocked: false };
        }

        const newCompletedTours = [...state.completedTourIds, tourId];
        const pointsEarned = 500;
        const currentPoints = state.points + pointsEarned;

        set({
          completedTourIds: newCompletedTours,
          points: currentPoints
        });

        return { pointsEarned, newBadgeUnlocked: false };
      },

      solveQuiz: (quizId: number, isCorrect: boolean) => {
        const state = get();
        if (state.solvedQuizIds.includes(quizId)) {
          return { pointsEarned: 0, newBadgeUnlocked: false };
        }

        const newSolvedQuizzes = [...state.solvedQuizIds, quizId];
        let pointsEarned = 0;
        let correctCount = state.correctQuizzesCount;

        if (isCorrect) {
          pointsEarned = 50;
          correctCount += 1;
        }

        const currentPoints = state.points + pointsEarned;
        const newUnlockedBadges = [...state.unlockedBadges];

        // 4. Quiz Master: 3 correct quizzes
        if (correctCount >= 3 && !newUnlockedBadges.includes('quiz_master')) {
          newUnlockedBadges.push('quiz_master');
        }

        const newBadgeUnlocked = newUnlockedBadges.length > state.unlockedBadges.length;

        set({
          solvedQuizIds: newSolvedQuizzes,
          correctQuizzesCount: correctCount,
          points: currentPoints,
          unlockedBadges: newUnlockedBadges
        });

        return { pointsEarned, newBadgeUnlocked };
      },

      resetGamification: () => {
        set({
          points: 0,
          visitedPoiIds: [],
          visitedPoiCategories: {},
          completedTourIds: [],
          solvedQuizIds: [],
          correctQuizzesCount: 0,
          unlockedBadges: []
        });
      }
    }),
    {
      name: 'vke-gamification-storage',
    }
  )
);
