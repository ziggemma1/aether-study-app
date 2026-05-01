import React from 'react';
import { motion } from 'framer-motion';
import { Book, ChevronRight, Globe, GraduationCap, Search, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import curriculumData from '../data/curriculum.json';

type Country = keyof typeof curriculumData;
type Exam = string;
type Subject = string;

import { SkillTreeView } from '../components/SkillTreeView';

export default function CurriculumLibrary() {
  const navigate = useNavigate();
  const { t } = useAppContext();
  const [selectedCountry, setSelectedCountry] = React.useState<Country | ''>('');
  const [selectedExam, setSelectedExam] = React.useState<Exam | ''>('');
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | ''>('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const countries = Object.keys(curriculumData) as Country[];
  const exams = selectedCountry ? Object.keys(curriculumData[selectedCountry]) : [];
  const subjects = (selectedCountry && selectedExam) ? Object.keys((curriculumData[selectedCountry] as any)[selectedExam]) : [];
  const topics = (selectedCountry && selectedExam && selectedSubject) ? (curriculumData[selectedCountry] as any)[selectedExam][selectedSubject] : [];

  const handleTopicSelect = (topic: any) => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      navigate('/library');
    }, 2000);
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4">
          <Sparkles size={14} />
          <span>{t('new_textbook_mode')}</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-text-main">{t('curriculum_library_title')}</h1>
        <p className="text-text-muted max-w-2xl mx-auto">
          {t('curriculum_library_desc')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Selectors */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2 flex items-center gap-2">
                <Globe size={16} /> {t('country')}
              </label>
              <select 
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value as Country); setSelectedExam(''); setSelectedSubject(''); }}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-surface text-text-main"
              >
                <option value="">{t('select_country')}</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-muted mb-2 flex items-center gap-2">
                <GraduationCap size={16} /> {t('exam_curriculum')}
              </label>
              <select 
                disabled={!selectedCountry}
                value={selectedExam}
                onChange={(e) => { setSelectedExam(e.target.value); setSelectedSubject(''); }}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-surface text-text-main disabled:opacity-50"
              >
                <option value="">{t('select_exam')}</option>
                {exams.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-muted mb-2 flex items-center gap-2">
                <Book size={16} /> {t('subject')}
              </label>
              <select 
                disabled={!selectedExam}
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-surface text-text-main disabled:opacity-50"
              >
                <option value="">{t('select_subject')}</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
              <Sparkles size={16} /> {t('pro_tip')}
            </h4>
            <p className="text-sm text-text-muted leading-relaxed">
              {t('pro_tip_desc')}
            </p>
          </div>
        </div>

        {/* Topics List */}
        <div className="lg:col-span-2">
          {isProcessing ? (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2 text-text-main">{t('generating_study_materials')}</h3>
              <p className="text-text-muted">{t('generating_study_materials_desc')}</p>
            </div>
          ) : selectedSubject ? (
            <SkillTreeView 
              subject={selectedSubject} 
              topics={topics} 
              onTopicSelect={handleTopicSelect} 
            />
          ) : (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[400px] border-dashed">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center text-text-muted mb-6 border border-border">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold text-text-muted mb-2">{t('select_subject_to_see_topics')}</h3>
              <p className="text-text-muted max-w-xs">{t('use_filters_to_browse')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
