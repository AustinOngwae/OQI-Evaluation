import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import html2pdf from 'html2pdf.js';
import { ChevronLeft, ChevronRight, Send, Download, Info, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import OQIEvaluationSummary from './OQIEvaluationSummary';
import QuestionResources from '../resources/QuestionResources';
import SessionStart from './SessionStart';
import DisplaySessionIdModal from './DisplaySessionIdModal';
import { STEP_TITLES } from '../../utils/constants';

const EnhancedQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [questions, setQuestions] = useState([]);
  const [evaluationItems, setEvaluationItems] = useState([]);
  const [questionEvaluationMappings, setQuestionEvaluationMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [error, setError] = useState(null);
  const [viewingResourcesFor, setViewingResourcesFor] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  
  const [submissionId, setSubmissionId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionState, setSessionState] = useState('initial'); // 'initial', 'started', 'resumed', 'finished'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          { data: questionsData, error: questionsError },
          { data: evalItemsData, error: evalItemsError },
          { data: mappingsData, error: mappingsError }
        ] = await Promise.all([
          supabase.from('questions').select('*').order('step_id', { ascending: true }),
          supabase.from('evaluation_items').select('*'),
          supabase.from('question_evaluation_mappings').select('*')
        ]);

        if (questionsError) throw questionsError;
        if (evalItemsError) throw evalItemsError;
        if (mappingsError) throw mappingsError;

        setQuestions(questionsData);
        setEvaluationItems(evalItemsData);
        setQuestionEvaluationMappings(mappingsData);

      } catch (err) {
        console.error('EnhancedQuestionnaire: Error fetching questionnaire data:', err.message);
        setError('Failed to load evaluation. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

      setSubmissionId(data.id);
      setSessionId(newSessionId);
      setUserInfo(newUserInfo);
      setSessionState('started');
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

      setSubmissionId(data.id);
      setSessionId(data.session_id);
      setUserInfo(data.user_context);
      setFormData(data.answers || {});
      setSessionState('resumed');
      toast.success('Session resumed successfully!', { id: toastId });
    } catch (err) {
      console.error('Error resuming session:', err.message);
      toast.error(err.message, { id: toastId });
    }
  };

  const saveProgress = async () => {
    if (!submissionId) return;
    const toastId = toast.loading('Saving...');
    const { error } = await supabase
      .from('questionnaire_submissions')
      .update({ answers: formData })
      .eq('id', submissionId);
    
    if (error) {
      toast.error('Failed to save progress.', { id: toastId });
    } else {
      toast.success('Progress saved!', { id: toastId });
    }
  };

  const handleInputChange = (questionId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
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
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: submissionError } = await supabase
        .from('questionnaire_submissions')
        .update({ answers: formData })
        .eq('id', submissionId);

      if (submissionError) throw submissionError;

      const generatedEvaluation = generateEvaluationResults(formData);
      setEvaluationResults(generatedEvaluation);
      setShowResults(true);
      setSessionState('finished');
    } catch (err) {
      console.error('EnhancedQuestionnaire: Error submitting or generating evaluation:', err.message);
      setError('Failed to submit your answers and generate evaluation report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateEvaluationResults = (data) => {
    const results = {
      scientific_relevance: [], impact_relevance: [], efficient_use_of_resources: [],
      business_model_sustainability: [], profile_of_oqi_community: [], support_influence_quantum_community: [],
      keyEvaluationAspects: new Set()
    };

    for (const questionId in data) {
      const answerValue = data[questionId]?.answer;
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

  const downloadPDF = () => {
    const element = document.getElementById('results-printable');
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `gesda-oqi-evaluation-report-${new Date().toISOString().split('T')[0]}.pdf`,
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
                  <input type="radio" name={question.id} value={option.value} checked={value === option.value} onChange={(e) => handleInputChange(question.id, 'answer', e.target.value)} className="mt-1 h-4 w-4 text-brand-purple bg-transparent border-white/30 focus:ring-brand-purple" />
                  <div className="ml-3"><span className="font-semibold block text-white">{option.label}</span>{option.description && <span className="text-sm text-gray-300">{option.description}</span>}</div>
                </label>
              ))}
            </div>
          );
        case 'checkbox':
          return (
            <div className="space-y-3">
              {options.map((option, index) => (
                <label key={index} className="flex items-start p-3 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10">
                  <input type="checkbox" value={option.value} checked={(value || []).includes(option.value)} onChange={(e) => { const currentValues = value || []; const newValues = e.target.checked ? [...currentValues, option.value] : currentValues.filter(v => v !== option.value); handleInputChange(question.id, 'answer', newValues); }} className="mt-1 h-4 w-4 text-brand-purple bg-transparent border-white/30 rounded focus:ring-brand-purple" />
                  <div className="ml-3"><span className="font-semibold block text-white">{option.label}</span>{option.description && <span className="text-sm text-gray-300">{option.description}</span>}</div>
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
          <label htmlFor={`comment-${question.id}`} className="text-sm font-medium text-gray-300">Additional Comments (Optional)</label>
          <textarea id={`comment-${question.id}`} value={formData[question.id]?.comment || ''} onChange={(e) => handleInputChange(question.id, 'comment', e.target.value)} className="mt-1 text-sm" placeholder="Add any extra information or context here..." rows="2" />
        </div>
      </>
    );
  };

  const currentQuestions = questions.filter(q => q.step_id === currentStep);
  const totalSteps = Math.max(...questions.map(q => q.step_id), 1);

  const NavigationButtons = ({ isTop = false }) => (
    <div className={`flex justify-between items-center ${isTop ? 'mb-6 pb-6 border-b border-white/20' : 'mt-8 pt-6 border-t border-white/20'}`}>
      <button onClick={handlePrevious} disabled={currentStep === 1} className="btn-secondary flex items-center">
        <ChevronLeft size={20} className="mr-2" /> Previous
      </button>
      <button onClick={saveProgress} className="btn-secondary flex items-center">
        <Save size={16} className="mr-2" /> Save Progress
      </button>
      {currentStep === totalSteps ? (
        <button onClick={handleSubmit} className="btn-primary flex items-center px-8 py-3">
          <Send size={18} className="mr-2" /> Generate Evaluation Report
        </button>
      ) : (
        <button onClick={handleNext} className="btn-primary flex items-center" disabled={currentQuestions.length === 0}>
          Next <ChevronRight size={20} className="ml-2" />
        </button>
      )}
    </div>
  );

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto mb-4"></div><p className="text-gray-300">Loading evaluation data...</p></div>;
  if (error) return <div className="text-center py-12 text-red-400"><p>{error}</p></div>;
  
  if (sessionState === 'initial') {
    return <SessionStart onResume={handleResumeSession} onNewUserSubmit={handleNewUserSubmit} />;
  }

  if (sessionState === 'started') {
    return <DisplaySessionIdModal sessionId={sessionId} onContinue={() => setSessionState('resumed')} />;
  }

  if (showResults && evaluationResults) {
    const evaluationFocusText = "OQI pilot evaluation";
    const evaluationAspectsMap = { 'Quality and impact of results': { icon: '✨', text: 'Quality & Impact of Results' }, 'Cost and sustainability': { icon: '💰', text: 'Cost & Sustainability' }, 'Multi-stakeholder support': { icon: '🤝', text: 'Multi-stakeholder Support' } };
    const getEvaluationSection = (title, evalArray) => {
      if (!evalArray || evalArray.length === 0) return null;
      return (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-purple-400 mb-4 border-b-2 border-purple-400/30 pb-2">{title}</h3>
          <div className="space-y-4">{evalArray.map((item, index) => <div key={item.id || index} className="bg-white/5 p-4 rounded-lg border border-white/20"><h4 className="font-semibold text-lg text-white">{item.title}</h4><p className="text-gray-300 mt-1">{item.text}</p></div>)}</div>
        </div>
      );
    };

    return (
      <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-6">
        <div className="glass-card p-4 sm:p-6 md:p-8">
          {/* Content visible on screen */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">GESDA OQI Evaluation Report</h1>
          </div>
          {getEvaluationSection('Scientific Relevance', evaluationResults.scientific_relevance)}
          {getEvaluationSection('Impact Relevance', evaluationResults.impact_relevance)}
          {getEvaluationSection('Efficient Use of Resources', evaluationResults.efficient_use_of_resources)}
          {getEvaluationSection('Business Model & Sustainable Funding', evaluationResults.business_model_sustainability)}
          {getEvaluationSection('Profile of the OQI Community', evaluationResults.profile_of_oqi_community)}
          {getEvaluationSection('Support of, and Influence on the Quantum Community', evaluationResults.support_influence_quantum_community)}
          <OQIEvaluationSummary evaluationResults={evaluationResults} evaluationFocusText={evaluationFocusText} />

          {/* Hidden content for PDF generation */}
          <div className="hidden">
            <div id="results-printable" className="pdf-content">
              <div className="text-center mb-8 border-b border-gray-200 pb-6">
                <h1>GESDA OQI Evaluation Report</h1>
                <p>Generated on {new Date().toLocaleDateString()}</p>
              </div>
              <OQIEvaluationSummary evaluationResults={evaluationResults} evaluationFocusText={evaluationFocusText} />
              <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>This evaluation report is developed in partnership with GESDA</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 no-print">
            <button id="download-pdf-btn" onClick={downloadPDF} className="btn-primary w-full sm:w-auto flex items-center justify-center"><Download size={18} className="mr-2" /> Download Summary PDF</button>
            <button onClick={() => { setShowResults(false); setCurrentStep(1); setFormData({}); setUserInfo(null); setSessionState('initial'); }} className="btn-secondary w-full sm:w-auto">Start Over</button>
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
              <h2 className="text-xl font-bold text-white">Resources for: "{viewingResourcesFor.title}"</h2>
              <button onClick={() => setViewingResourcesFor(null)} className="p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
            </div>
            <QuestionResources questionId={viewingResourcesFor.id} />
          </div>
        </div>
      )}

      <div className="glass-card p-4 sm:p-6 md:p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-white">Step {currentStep}: {STEP_TITLES[currentStep]}</h2>
            <span className="text-sm text-gray-400">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-brand-purple h-2 rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div></div>
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
                      <h3 className="text-lg font-semibold text-white mb-2">{question.title}{question.required && <span className="text-red-400 ml-1">*</span>}</h3>
                      {question.description && <p className="text-gray-300 text-sm">{question.description}</p>}
                    </div>
                    <button onClick={() => setViewingResourcesFor(question)} className="ml-4 flex items-center text-sm text-brand-purple-light hover:text-white font-medium" title="View related resources"><Info size={18} className="mr-1" /> Resources</button>
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