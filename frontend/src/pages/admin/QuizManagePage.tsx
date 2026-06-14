import { useEffect, useState } from 'react';
import { adminApi } from '@/api/admin';
import { poisApi } from '@/api/pois';
import { quizApi } from '@/api/quiz';
import type { POIListItem } from '@/types/poi';
import type { QuizQuestion } from '@/types/api';
import { Loader2, Plus, Edit2, Trash2, Save, HelpCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';

export default function QuizManagePage() {
  const { success, error: toastError } = useToast();

  const [pois, setPois] = useState<POIListItem[]>([]);
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingPois, setLoadingPois] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [answerA, setAnswerA] = useState('');
  const [answerB, setAnswerB] = useState('');
  const [answerC, setAnswerC] = useState('');
  const [answerD, setAnswerD] = useState('');
  const [correctOption, setCorrectOption] = useState('A');
  const [explanationText, setExplanationText] = useState('');

  // 1. Load POIs list
  useEffect(() => {
    const fetchPOIs = async () => {
      setLoadingPois(true);
      try {
        const { data } = await poisApi.getAll();
        setPois(data);
        if (data.length > 0) {
          setSelectedPoiId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load POIs:', err);
        toastError('Failed to fetch food spots.');
      } finally {
        setLoadingPois(false);
      }
    };
    fetchPOIs();
  }, [toastError]);

  // 2. Fetch Quiz Questions when selected POI changes
  useEffect(() => {
    if (!selectedPoiId) return;

    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const { data } = await quizApi.getQuiz(selectedPoiId);
        setQuestions(data);
      } catch (err) {
        console.error('Failed to fetch quiz:', err);
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [selectedPoiId]);

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setAnswerA('');
    setAnswerB('');
    setAnswerC('');
    setAnswerD('');
    setCorrectOption('A');
    setExplanationText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: QuizQuestion) => {
    // We need correct option and explanation. The backend entity has CorrectOption and ExplanationText, but let's see.
    // In our api types:
    // export interface QuizQuestion { id, poiId, questionText, answerA, answerB, answerC, answerD }
    // Wait, let's cast or find their properties.
    const extendedQ = q as any;
    setEditingQuestion(q);
    setQuestionText(q.questionText);
    setAnswerA(q.answerA);
    setAnswerB(q.answerB);
    setAnswerC(q.answerC);
    setAnswerD(q.answerD);
    setCorrectOption(extendedQ.correctOption || 'A');
    setExplanationText(extendedQ.explanationText || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this quiz question?')) return;

    try {
      await adminApi.deleteQuiz(id);
      success('Question deleted successfully!');
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error('Failed to delete question:', err);
      toastError('Deletion failed.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoiId) return;

    const payload = {
      poiId: selectedPoiId,
      questionText,
      answerA,
      answerB,
      answerC,
      answerD,
      correctOption,
      explanationText,
    };

    setSaving(true);
    try {
      if (editingQuestion) {
        const { data } = await adminApi.updateQuiz(editingQuestion.id, payload);
        success('Question updated successfully!');
        setQuestions((prev) => prev.map((q) => (q.id === editingQuestion.id ? data : q)));
      } else {
        const { data } = await adminApi.createQuiz(payload);
        success('Quiz question added successfully!');
        setQuestions((prev) => [...prev, data]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save quiz question:', err);
      toastError('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            Quiz Challenge Manager
          </h2>
          <p className="text-xs text-text-secondary">
            Manage culinary and cultural trivia questions for Vĩnh Khánh food spots
          </p>
        </div>

        {selectedPoiId && (
          <button
            onClick={handleOpenAdd}
            className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md outline-none cursor-pointer shrink-0 align-self-start"
          >
            <Plus size={16} />
            <span>Add Question</span>
          </button>
        )}
      </div>

      {/* POI Selector Dropdown */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-xs">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider shrink-0">
          Select Food Spot:
        </label>
        {loadingPois ? (
          <Loader2 className="animate-spin text-primary" size={16} />
        ) : (
          <select
            value={selectedPoiId || ''}
            onChange={(e) => setSelectedPoiId(parseInt(e.target.value) || null)}
            className="w-full sm:max-w-sm h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
          >
            {pois.map((poi) => (
              <option key={poi.id} value={poi.id}>
                {poi.name} ({poi.category})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Questions list */}
      {loadingQuestions ? (
        <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
          <Loader2 className="animate-spin text-primary" size={28} />
          <span className="text-xs font-semibold">Loading questions...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
            <HelpCircle size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-extrabold text-base text-text-primary">No questions yet</h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              Create trivia questions for this food spot to engage travelers in cultural fun challenges.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:opacity-90 transition-all"
          >
            Create First Question
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                  <th className="p-4">Question Text</th>
                  <th className="p-4">Options</th>
                  <th className="p-4">Correct</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {questions.map((q) => {
                  const extendedQ = q as any;
                  return (
                    <tr key={q.id} className="hover:bg-surface-alt/40 transition-colors">
                      <td className="p-4 font-bold text-text-primary max-w-xs sm:max-w-md whitespace-pre-wrap leading-relaxed">
                        {q.questionText}
                      </td>
                      <td className="p-4 text-text-secondary leading-snug">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-medium max-w-xs">
                          <div>A: {q.answerA}</div>
                          <div>B: {q.answerB}</div>
                          {q.answerC && <div>C: {q.answerC}</div>}
                          {q.answerD && <div>D: {q.answerD}</div>}
                        </div>
                      </td>
                      <td className="p-4 font-display font-extrabold text-accent text-sm">
                        {extendedQ.correctOption || 'A'}
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="p-2 border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover rounded-lg transition-colors cursor-pointer outline-none"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-2 border border-border bg-card text-danger hover:border-danger/45 hover:bg-danger/5 rounded-lg transition-colors cursor-pointer outline-none"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL FORM */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestion ? 'Edit Quiz Question' : 'Add Quiz Question'}
        size="md"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Question Text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Question Text *</label>
            <textarea
              disabled={saving}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. What is the main characteristic ingredient in snails with coconut sauce?"
              rows={2}
              className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
              required
            />
          </div>

          {/* Answer Options Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Answer A *</label>
              <input
                type="text"
                disabled={saving}
                value={answerA}
                onChange={(e) => setAnswerA(e.target.value)}
                placeholder="Option A text..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Answer B *</label>
              <input
                type="text"
                disabled={saving}
                value={answerB}
                onChange={(e) => setAnswerB(e.target.value)}
                placeholder="Option B text..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Answer C</label>
              <input
                type="text"
                disabled={saving}
                value={answerC}
                onChange={(e) => setAnswerC(e.target.value)}
                placeholder="Option C text..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Answer D</label>
              <input
                type="text"
                disabled={saving}
                value={answerD}
                onChange={(e) => setAnswerD(e.target.value)}
                placeholder="Option D text..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Grid Correct Option & Explanation */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider font-display">Correct Option</label>
              <select
                disabled={saving}
                value={correctOption}
                onChange={(e) => setCorrectOption(e.target.value)}
                className="h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>

            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Explanation Text</label>
              <input
                type="text"
                disabled={saving}
                value={explanationText}
                onChange={(e) => setExplanationText(e.target.value)}
                placeholder="e.g. Coconut milk provides the rich, creamy, and sweet base..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border text-text-secondary rounded-xl hover:bg-surface-alt font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span>Save Trivia</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
