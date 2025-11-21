import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Info, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import QuestionResources from '../resources/QuestionResources';
import SessionStart from './SessionStart';
import DisplaySessionIdModal from './DisplaySessionIdModal';
import { STEP_TITLES } from '../../utils/constants';
import { useData } from '../../context/DataContext';
import useQuestionnaireState from '../../hooks/useQuestionnaireState';
import { Button } from '@/components/ui/button';
import QuestionRenderer from './QuestionRenderer';
import QuestionnaireNavigation from './QuestionnaireNavigation';
import ResultsView from './ResultsView';

const EnhancedQuestionnaire = () => {
  const { questions, evaluationItems, questionEvaluationMappings } = useData();
  const location = useLocation();
  const isPreviewMode = new URLSearchParams(location.search).get('preview') === 'true';

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
    if (isPreviewMode) {
      setQuestionnaireState(prev => ({
        ...prev,
        sessionState: 'resumed' // Bypass session start screens
      }));
    }
  }, [isPreviewMode, setQuestionnaireState]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (!submissionId || isPreviewMode) return;

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
  }, [formData, submissionId, isPreviewMode]);

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
    if (isPreviewMode) {
      setQuestionnaireState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      return;
    }

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

  const currentQuestions = questions.filter(q => q.step_id === currentStep);
  const totalSteps = Math.max(...questions.map(q => q.step_id), 1);

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div><p className="text-gray-300">Generating your report...</p></div>;
  if (error) return <div className="text-center py-12 text-red-400"><p>{error}</p></div>;
  
  if (!isPreviewMode) {
    if (sessionState === 'initial') {
      return <SessionStart onResume={handleResumeSession} onNewUserSubmit={handleNewUserSubmit} />;
    }

    if (sessionState === 'started') {
      return <DisplaySessionIdModal sessionId={sessionId} onContinue={() => setQuestionnaireState(prev => ({...prev, sessionState: 'resumed'}))} />;
    }
  }

  if (showResults && evaluationResults) {
    return <ResultsView evaluationResults={evaluationResults} userInfo={userInfo} onStartOver={resetQuestionnaireState} />;
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

      {isPreviewMode && (
        <div className="bg-yellow-500/20 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Eye className="h-5 w-5 text-yellow-300" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-200">
                You are in Preview Mode. Answers cannot be submitted.
              </p>
            </div>
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
        
        <div className="mb-6 pb-6 border-b border-white/20">
          <QuestionnaireNavigation
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isFirstStep={currentStep === 1}
            isLastStep={currentStep === totalSteps}
            isNextDisabled={currentQuestions.length === 0}
            savingStatus={savingStatus}
            isPreview={isPreviewMode}
          />
        </div>

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
                <QuestionRenderer 
                  question={question}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  isPreview={isPreviewMode}
                />
              </div>
            ))
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/20">
           <QuestionnaireNavigation
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isFirstStep={currentStep === 1}
            isLastStep={currentStep === totalSteps}
            isNextDisabled={currentQuestions.length === 0}
            savingStatus={savingStatus}
            isPreview={isPreviewMode}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedQuestionnaire;