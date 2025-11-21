import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';
import html2pdf from 'html2pdf.js';
import { ChevronLeft, ChevronRight, Send, Download, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';
import OQIEvaluationSummary from './OQIEvaluationSummary';
import QuestionResources from '../resources/QuestionResources';
import SessionStart from './SessionStart';
import DisplaySessionIdModal from './DisplaySessionIdModal';
import { STEP_TITLES } from '../../utils/constants';
import { useData } from '../../context/DataContext';
import useQuestionnaireState from '../../hooks/useQuestionnaireState';
import { Button } from '@/components/ui/button';

const EnhancedQuestionnaire = () => {
  const { questions, evaluationItems, questionEvaluationMappings } = useData();

  const [
    { 
      currentStep, 
      formData, 
      submissionId, 
      sessionId, 
      sessionState, 
      showResults,
      userInfo,
      evaluationResults
    }, 
    setQuestionnaireState,
    resetQuestionnaireState
  ] = useQuestionnaireState();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewingResourcesFor, setViewingResourcesFor] = useState(null);
  const [savingStatus, setSavingStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'

  const debounceTimeoutRef = useRef(null);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (!submissionId) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      saveProgress();
    }, 1500); // Auto-save after 1.5s of inactivity

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [formData, submissionId]);

  const generateUniqueSessionId = async () => {
    let newId;
    let isUnique = false;
    while (!isUnique) {
      newId = Math.floor(1000 + Math.random() * 9000).toString();
      const { data, error } = await supabase
        .from('questionnaire_submissions')
        .select('id')
        .eq('session_id', newId)
        .single();
      if (!data && (!error || error.code === 'PGRST116')) { // PGRST116 means no rows found, which is good
        isUnique = true;
      } else if (error && error.code !== 'PGRST116') {
        throw error;
      }
    }
    return newId;
  };

  const handleNewUserSubmit = async (newUserInfo) => {
    const toastId = toast.loading('Creating your session...');
    try {
      const newSessionId = await generateUniqueSessionId();
      
      const { data, error } = await supabase
        .from('questionnaire_submissions')
        .insert({
          user_context: newUserInfo,
          answers: {},
          session_id: newSessionId,
        })
        .select()
        .single();

      if (error) throw error;

      setQuestionnaireState(prev => ({
        ...prev,
        submissionId: data.id,
        sessionId: newSessionId,
        userInfo: newUserInfo,
        sessionState: 'started',
      }));
      toast.dismiss(toastId);
    } catch (err) {
      console.error('Error creating session:', err.message);
      toast.error('Could not create your session. Please try again.', { id: toastId });
    }
  };

  const handleResumeSession = async (resumeId) => {
    const toastId = toast.loading('Finding your session...');
    try {
      const { data, error } = await supabase
        .from('questionnaire_submissions')
        .select('*')
        .eq('session_id', resumeId)
        .single();

      if (error || !data) {
        throw new Error('Session not found or invalid code.');
      }

      setQuestionnaireState(prev => ({
        ...prev,
        submissionId: data.id,
        sessionId: data.session_id,
        userInfo: data.user_context,
        formData: data.answers || {},
        sessionState: 'resumed',
      }));
      toast.success('Session resumed successfully!', { id: toastId });
    } catch (err) {
      console.error('Error resuming session:', err.message);
      toast.error(err.message, { id: toastId });
    }
  };

  const saveProgress = async () => {
    if (!submissionId) return;
    setSavingStatus('saving');
    const { error } = await supabase
      .from('questionnaire_submissions')
      .update({ answers: formData })
      .eq('id', submissionId);
    
    if (error) {
      setSavingStatus('error');
      console.error('Auto-save error:', error);
    } else {
      setSavingStatus('saved');
    }
    
    setTimeout(() => setSavingStatus('idle'), 2500);
  };

  const handleInputChange = (questionId, field, value) => {
    setQuestionnaireState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [questionId]: {
          ...prev.formData[questionId],
          [field]: value,
        },
      },
    }));
  };

  const handleNext = () => {
    const currentQuestions = questions.filter(q => q.step_id === currentStep);
    const requiredQuestions = currentQuestions.filter(q => q.required);

    const isValid = requiredQuestions.every(q => {
      const value = formData[q.id]?.answer;
      if (q.type === 'checkbox') {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== null && String(value).trim() !== '';
    });

    if (!isValid) {
      toast.error('Please complete all required fields before continuing.');
      return;
    }
    setQuestionnaireState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
  };

  const handlePrevious = () => setQuestionnaireState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));

  const generateEvaluationResults = (data) => {
    const results = {
      scientific_relevance: [], impact_relevance: [], efficient_use_of_resources: [],
      business_model_sustainability: [], profile_of_oqi_community: [], support_influence_quantum_community: [],
      keyEvaluationAspects: new Set()
    };

    for (const questionId in data) {
      const answerValue = data[questionId]?.answer;
      if (!answerValue) continue;
      const answerValues = Array.isArray(answerValue) ? answerValue : [answerValue];

      answerValues.forEach(val => {
        const relevantMappings = questionEvaluationMappings.filter(
          mapping => mapping.question_id === questionId && mapping.answer_value === val
        );
        relevantMappings.forEach(mapping => {
          const evaluationItem = evaluationItems.find(item => item.id === mapping.recommendation_item_id);
          if (evaluationItem) {
            const category = evaluationItem.type || 'scientific_relevance';
            if (results[category]) {
              results[category].push(evaluationItem);
            }
            if (evaluationItem.category) {
              results.keyEvaluationAspects.add(evaluationItem.category);
            }
          }
        });
      });
    }
    return results;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const toastId = toast.loading('Generating your report...');
    try {
      await saveProgress();

      const generatedEvaluation = generateEvaluationResults(formData);
      
      setQuestionnaireState(prev => ({
        ...prev,
        evaluationResults: generatedEvaluation,
        showResults: true,
        sessionState: 'finished',
      }));
      toast.success('Report generated successfully!', { id: toastId });
    } catch (err) {
      console.error('EnhancedQuestionnaire: Error submitting or generating report:', err.message);
      setError(`Failed to generate your report. Please try again. Error: ${err.message}`);
      toast.error(`Failed to generate report: ${err.message}`, { id: toastId, duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const element = document.getElementById('results-printable');
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `gesda-oqi-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    const btn = document.getElementById('download-pdf-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Generating PDF...';
    btn.disabled = true;
    html2pdf().set(opt).from(element).save().then(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }).catch(error => {
      console.error('PDF generation failed:', error);
      btn.innerHTML = originalText;
      btn.disabled = false;
      alert('PDF generation failed. Please try again.');
    });
  };

  const renderQuestion = (question) => {
    const value = formData[question.id]?.answer;
    const options = question.options || [];

    const inputElement = (() => {
      switch (question.type) {
        case 'radio':
          return (
            <div className="space-y-3">
              {options.map((option, index) => (
                <label key={index} className="flex items-start p-3 sm:p-4 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <input type="radio" name={question.id} value={option.value} checked={value === option.value} onChange={(e) => handleInputChange(question.id, 'answer', e.target.value)} className="mt-1 h-4 w-4 text-brand-primary bg-transparent border-white/30 focus:ring-brand-primary" />
                  <div className="ml-3"><span className="font-semibold block text-white">{option.label}</span>{option.description && <span className="text-sm text-gray-300 font-body">{option.description}</span>}</div>
                </label>
              ))}
            </div>
          );
        case 'checkbox':
          return (
            <div className="space-y-3">
              {options.map((option, index) => (
                <label key={index} className="flex items-start p-3 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10">
                  <input type="checkbox" value={option.value} checked={(value || []).includes(option.value)} onChange={(e) => { const currentValues = value || []; const newValues = e.target.checked ? [...currentValues, option.value] : currentValues.filter(v => v !== option.value); handleInputChange(question.id, 'answer', newValues); }} className="mt-1 h-4 w-4 text-brand-primary bg-transparent border-white/30 rounded focus:ring-brand-primary" />
                  <div className="ml-3"><span className="font-semibold block text-white">{option.label}</span>{option.description && <span className="text-sm text-gray-300 font-body">{option.description}</span>}</div>
                </label>
              ))}
            </div>
          );
        case 'select':
          return (
            <select value={value || ''} onChange={(e) => handleInputChange(question.id, 'answer', e.target.value)} required={question.required}>
              <option value="" disabled>-- Please select an option --</option>
              {options.map((option, index) => <option key={index} value={option.value}>{option.label}</option>)}
            </select>
          );
        case 'text':
          return <input type="text" value={value || ''} onChange={(e) => handleInputChange(question.id, 'answer', e.target.value)} placeholder={question.placeholder || 'Enter your response'} required={question.required} />;
        default: return null;
      }
    })();

    return (
      <>
        {inputElement}
        <div className="mt-4">
          <label htmlFor={`comment-${question.id}`} className="text-sm font-medium text-gray-300 font-body">Additional Comments (Optional)</label>
          <textarea id={`comment-${question.id}`} value={formData[question.id]?.comment || ''} onChange={(e) => handleInputChange(question.id, 'comment', e.target.value)} className="mt-1 text-sm" placeholder="Add any extra information or context here..." rows="2" />
        </div>
      </>
    );
  };

  const currentQuestions = questions.filter(q => q.step_id === currentStep);
  const totalSteps = Math.max(...questions.map(q => q.step_id), 1);

  const NavigationButtons = ({ isTop = false }) => (
    <div className={`flex justify-between items-center ${isTop ? 'mb-6 pb-6 border-b border-white/20' : 'mt-8 pt-6 border-t border-white/20'}`}>
      <Button onClick={handlePrevious} variant="secondary" disabled={currentStep === 1}>
        <ChevronLeft size={20} className="mr-2" /> Previous
      </Button>
      <div className="text-sm text-gray-400 h-5 flex items-center transition-all duration-300">
        {savingStatus === 'saving' && <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50 mr-2"></div> Saving...</>}
        {savingStatus === 'saved' && 'All changes saved.'}
        {savingStatus === 'error' && <span className="text-red-400">Save failed.</span>}
      </div>
      {currentStep === totalSteps ? (
        <Button onClick={handleSubmit} size="lg">
          <Send size={18} className="mr-2" /> Generate Report
        </Button>
      ) : (
        <Button onClick={handleNext} disabled={currentQuestions.length === 0}>
          Next <ChevronRight size={20} className="ml-2" />
        </Button>
      )}
    </div>
  );

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div><p className="text-gray-300">Generating your report...</p></div>;
  if (error) return <div className="text-center py-12 text-red-400"><p>{error}</p></div>;
  
  if (sessionState === 'initial') {
    return <SessionStart onResume={handleResumeSession} onNewUserSubmit={handleNewUserSubmit} />;
  }

  if (sessionState === 'started') {
    return <DisplaySessionIdModal sessionId={sessionId} onContinue={() => setQuestionnaireState(prev => ({...prev, sessionState: 'resumed'}))} />;
  }

  if (showResults && evaluationResults) {
    return (
      <div className="max-w-4xl mx-auto p-2 sm:p-4 md:p-6">
        <div className="glass-card p-4 sm:p-6 md:p-8">
          <div id="results-printable">
            <OQIEvaluationSummary 
              evaluationResults={evaluationResults} 
              evaluationFocusText={`${userInfo?.firstName || 'User'}'s OQI pilot evaluation`} 
            />
            <div className="pdf-only" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '12px', color: '#888' }}>
              <p>This evaluation report is developed in partnership with GESDA</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 no-print">
            <Button id="download-pdf-btn" onClick={downloadPDF} className="w-full sm:w-auto"><Download size={18} className="mr-2" /> Download Report PDF</Button>
            <Button onClick={resetQuestionnaireState} variant="secondary" className="w-full sm:w-auto">Start Over</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 md:p-6">
      {viewingResourcesFor && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/20 pb-3 mb-4">
              <h2 className="text-xl font-bold text-white font-sans">Resources for: "{viewingResourcesFor.title}"</h2>
              <Button variant="ghost" size="icon" onClick={() => setViewingResourcesFor(null)}><X size={20} /></Button>
            </div>
            <QuestionResources questionId={viewingResourcesFor.id} />
          </div>
        </div>
      )}

      <div className="glass-card p-4 sm:p-6 md:p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-white font-sans">Step {currentStep}: {STEP_TITLES[currentStep]}</h2>
            <span className="text-sm text-gray-400">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-brand-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div></div>
        </div>
        <NavigationButtons isTop={true} />
        <div className="space-y-8">
          {currentQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No questions found for this step.</p>
            </div>
          ) : (
            currentQuestions.map(question => (
              <div key={question.id} className="border-b border-white/20 pb-6 last:border-b-0">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2 font-sans">{question.title}{question.required && <span className="text-red-400 ml-1">*</span>}</h3>
                      {question.description && <p className="text-gray-300 text-sm font-body">{question.description}</p>}
                    </div>
                    <Button variant="link" onClick={() => setViewingResourcesFor(question)} title="View related resources"><Info size={18} className="mr-1" /> Resources</Button>
                  </div>
                </div>
                {renderQuestion(question)}
              </div>
            ))
          )}
        </div>
        <NavigationButtons />
      </div>
    </div>
  );
};

export default EnhancedQuestionnaire;