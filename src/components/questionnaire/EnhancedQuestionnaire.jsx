import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import html2pdf from 'html2pdf.js';
import { ChevronLeft, ChevronRight, Send, Download, Info, X } from 'lucide-react';
import OQIEvaluationSummary from './OQIEvaluationSummary';
import QuestionResources from '../resources/QuestionResources';

const EnhancedQuestionnaire = ({ user }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [questions, setQuestions] = useState([]);
  const [evaluationItems, setEvaluationItems] = useState([]);
  const [questionEvaluationMappings, setQuestionEvaluationMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [error, setError] = useState(null);
  const [viewingResourcesFor, setViewingResourcesFor] = useState(null); // Holds question object

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('EnhancedQuestionnaire: Fetching questions...');
        const { data: questionsData, error: questionsError } = await supabase.from('questions').select('*').order('step_id', { ascending: true });
        if (questionsError) throw questionsError;
        console.log('EnhancedQuestionnaire: Fetched questionsData:', questionsData);
        setQuestions(questionsData);

        console.log('EnhancedQuestionnaire: Fetching evaluation items...');
        const { data: evalItemsData, error: evalItemsError } = await supabase.from('evaluation_items').select('*');
        if (evalItemsError) throw evalItemsError;
        console.log('EnhancedQuestionnaire: Fetched evalItemsData:', evalItemsData);
        setEvaluationItems(evalItemsData);

        console.log('EnhancedQuestionnaire: Fetching question evaluation mappings...');
        const { data: mappingsData, error: mappingsError } = await supabase.from('question_evaluation_mappings').select('*');
        if (mappingsError) throw mappingsError;
        console.log('EnhancedQuestionnaire: Fetched mappingsData:', mappingsData);
        setQuestionEvaluationMappings(mappingsData);

      } catch (err) {
        console.error('EnhancedQuestionnaire: Error fetching questionnaire data:', err.message);
        setError('Failed to load evaluation. Please try again.');
      } finally {
        setLoading(false);
        console.log('EnhancedQuestionnaire: Finished fetching data. Loading set to false.');
      }
    };

    fetchData();
  }, []);

  // Add a log to see the state of questions and currentStep after data is loaded
  useEffect(() => {
    console.log('EnhancedQuestionnaire: Questions state updated:', questions);
    console.log('EnhancedQuestionnaire: Current step:', currentStep);
    console.log('EnhancedQuestionnaire: Filtered currentQuestions for step', currentStep, ':', questions.filter(q => q.step_id === currentStep));
  }, [questions, currentStep]);

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
      alert('Please complete all required fields before continuing.');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: submissionError } = await supabase.from('questionnaire_submissions').insert({
        user_id: user.id,
        answers: formData,
      });
      if (submissionError) throw submissionError;

      const generatedEvaluation = generateEvaluationResults(formData);
      setEvaluationResults(generatedEvaluation);
      setShowResults(true);
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
                <label key={index} className="flex items-start p-4 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
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
  if (showResults && evaluationResults) {
    const evaluationAspectsMap = { 'Quality and impact of results': { icon: '✨', text: 'Quality & Impact of Results' }, 'Cost and sustainability': { icon: '💰', text: 'Cost & Sustainability' }, 'Multi-stakeholder support': { icon: '🤝', text: 'Multi-stakeholder Support' } };
    const getEvaluationSection = (title, evalArray) => {
      if (!evalArray || evalArray.length === 0) return null;
      return (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-purple-700 mb-4 border-b-2 border-purple-200 pb-2">{title}</h3>
          <div className="space-y-4">{evalArray.map((item, index) => <div key={item.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h4 className="font-semibold text-lg text-gray-800">{item.title}</h4><p className="text-gray-600 mt-1">{item.text}</p></div>)}</div>
        </div>
      );
    };
    const evaluationFocusText = "OQI pilot evaluation";
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="glass-card p-8">
          <div id="results-printable" className="pdf-content">
            <div className="text-center mb-8 border-b border-gray-200 pb-6"><h1>GESDA OQI Evaluation Report</h1><p>Generated on {new Date().toLocaleDateString()}</p></div>
            {evaluationResults.keyEvaluationAspects.size > 0 && <div className="mt-8 p-4 bg-gray-100 rounded-lg"><h3 className="font-semibold text-gray-800 mb-4">Key Evaluation Aspects</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from(evaluationResults.keyEvaluationAspects).map(aspect => <div key={aspect} className="text-center p-3 bg-white rounded-lg"><span className="text-2xl">{evaluationAspectsMap[aspect]?.icon}</span><p className="text-sm font-medium mt-1">{evaluationAspectsMap[aspect]?.text || aspect}</p></div>)}</div></div>}
            {getEvaluationSection('Scientific Relevance', evaluationResults.scientific_relevance)}
            {getEvaluationSection('Impact Relevance', evaluationResults.impact_relevance)}
            {getEvaluationSection('Efficient Use of Resources', evaluationResults.efficient_use_of_resources)}
            {getEvaluationSection('Business Model & Sustainable Funding', evaluationResults.business_model_sustainability)}
            {getEvaluationSection('Profile of the OQI Community', evaluationResults.profile_of_oqi_community)}
            {getEvaluationSection('Support of, and Influence on the Quantum Community', evaluationResults.support_influence_quantum_community)}
            <OQIEvaluationSummary evaluationResults={evaluationResults} evaluationFocusText={evaluationFocusText} />
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500"><p>This evaluation report is developed in partnership with GESDA</p></div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 no-print">
            <button id="download-pdf-btn" onClick={downloadPDF} className="btn-primary w-full sm:w-auto flex items-center justify-center"><Download size={18} className="mr-2" /> Download PDF</button>
            <button onClick={() => { setShowResults(false); setCurrentStep(1); setFormData({}); }} className="btn-secondary w-full sm:w-auto">Start Over</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
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

      <div className="glass-card p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-gray-300">Step {currentStep} of {totalSteps}</span><span className="text-sm text-gray-400">{Math.round((currentStep / totalSteps) * 100)}% Complete</span></div>
          <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-brand-purple h-2 rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div></div>
        </div>
        <NavigationButtons isTop={true} />
        <div className="space-y-8">
          {currentQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No questions found for this step.</p>
              <p className="mt-2 text-sm">Please ensure questions are added via the <Link to="/editor" className="text-brand-purple-light hover:underline">Evaluation Editor</Link>.</p>
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