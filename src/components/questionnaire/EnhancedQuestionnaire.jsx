import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import html2pdf from 'html2pdf.js';
import { ChevronLeft, ChevronRight, Send, Download, Info } from 'lucide-react';
import OQIEvaluationSummary from './OQIEvaluationSummary'; // Renamed from AISummary
import PublicResourcesDisplay from '../resources/PublicResourcesDisplay';

const EnhancedQuestionnaire = ({ user }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [questions, setQuestions] = useState([]);
  const [evaluationItems, setEvaluationItems] = useState([]); // Renamed from recommendationItems
  const [questionEvaluationMappings, setQuestionEvaluationMappings] = useState([]); // Renamed from questionRecommendationMappings
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState(null); // Renamed from recommendations
  const [error, setError] = useState(null);
  const [showPublicResources, setShowPublicResources] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .order('step_id', { ascending: true });
        if (questionsError) throw questionsError;
        setQuestions(questionsData);

        // Fetch evaluation items (formerly recommendation items)
        const { data: evalItemsData, error: evalItemsError } = await supabase
          .from('recommendation_items') // Still using this table for now, will rename later
          .select('*');
        if (evalItemsError) throw evalItemsError;
        setEvaluationItems(evalItemsData);

        // Fetch question-evaluation mappings (formerly question-recommendation mappings)
        const { data: mappingsData, error: mappingsError } = await supabase
          .from('question_recommendation_mappings') // Still using this table for now, will rename later
          .select('*');
        if (mappingsError) throw mappingsError;
        setQuestionEvaluationMappings(mappingsData);

      } catch (err) {
        console.error('Error fetching questionnaire data:', err.message);
        setError('Failed to load evaluation. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    const currentQuestions = questions.filter(q => q.step_id === currentStep);
    const requiredQuestions = currentQuestions.filter(q => q.required);

    // Validate required fields
    const isValid = requiredQuestions.every(q => {
      const value = formData[q.id];
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
      // Save submission to the database
      const { error: submissionError } = await supabase
        .from('questionnaire_submissions')
        .insert({
          user_id: user.id,
          answers: formData,
        });

      if (submissionError) {
        throw submissionError;
      }

      const generatedEvaluation = generateEvaluationResults(formData);
      setEvaluationResults(generatedEvaluation);
      setShowResults(true);
    } catch (err) {
      console.error('Error submitting or generating evaluation:', err.message);
      setError('Failed to submit your answers and generate evaluation report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateEvaluationResults = (data) => {
    const results = {
      scientific_relevance: [],
      impact_relevance: [],
      resource_efficiency: [],
      business_model: [],
      community_profile: [],
      community_support: [],
      coBenefits: new Set() // Keeping coBenefits for now, can be adapted
    };

    // Iterate through user's answers and find matching evaluation items
    for (const questionId in data) {
      const answerValue = data[questionId];
      
      // Handle checkbox (multi-select) answers
      const answerValues = Array.isArray(answerValue) ? answerValue : [answerValue];

      answerValues.forEach(val => {
        const relevantMappings = questionEvaluationMappings.filter(
          mapping => mapping.question_id === questionId && mapping.answer_value === val
        );

        relevantMappings.forEach(mapping => {
          const evaluationItem = evaluationItems.find(item => item.id === mapping.recommendation_item_id);
          if (evaluationItem) {
            // Categorize evaluation items based on their type (will align with OQI criteria)
            switch (evaluationItem.type) {
              case 'scientific_relevance':
                results.scientific_relevance.push(evaluationItem);
                break;
              case 'impact_relevance':
                results.impact_relevance.push(evaluationItem);
                break;
              case 'resource_efficiency':
                results.resource_efficiency.push(evaluationItem);
                break;
              case 'business_model':
                results.business_model.push(evaluationItem);
                break;
              case 'community_profile':
                results.community_profile.push(evaluationItem);
                break;
              case 'community_support':
                results.community_support.push(evaluationItem);
                break;
              default:
                // Add to a generic category if type is unknown
                results.scientific_relevance.push(evaluationItem); 
            }
            // Add co-benefits (will need to be adapted for OQI context)
            if (evaluationItem.benefits) {
              evaluationItem.benefits.forEach(benefit => results.coBenefits.add(benefit));
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
    const value = formData[question.id];
    const options = question.options || [];

    switch (question.type) {
      case 'radio':
        return (
          <div className="space-y-3">
            {options.map((option, index) => (
              <label
                key={index}
                className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-purple-50 transition-colors"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  className="mt-1 h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <div className="ml-3">
                  <span className="font-semibold block">{option.label}</span>
                  {option.description && (
                    <span className="text-sm text-gray-500">{option.description}</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {options.map((option, index) => (
              <label
                key={index}
                className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-purple-50"
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter(v => v !== option.value);
                    handleInputChange(question.id, newValues);
                  }}
                  className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <div className="ml-3">
                  <span className="font-semibold block">{option.label}</span>
                  {option.description && (
                    <span className="text-sm text-gray-500">{option.description}</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required={question.required}
          >
            <option value="" disabled>-- Please select an option --</option>
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder={question.placeholder || 'Enter your response'}
            required={question.required}
          />
        );

      default:
        return null;
    }
  };

  const currentQuestions = questions.filter(q => q.step_id === currentStep);
  const totalSteps = Math.max(...questions.map(q => q.step_id), 1);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (showResults && evaluationResults) {
    const benefitsMap = { // Will need to be adapted for OQI context
      'Health': { icon: '❤️', text: 'Health & Well-being' },
      'Economy': { icon: '💰', text: 'Economic Growth' },
      'Environment': { icon: '🌳', text: 'Urban Environment' },
      'Social': { icon: '🤝', text: 'Community & Equity' },
      'Institutional': { icon: '🏛️', text: 'Governance' }
    };

    const getEvaluationSection = (title, evalArray) => {
      if (!evalArray || evalArray.length === 0) return null;
      return (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-purple-700 mb-4 border-b-2 border-purple-200 pb-2">
            {title}
          </h3>
          <div className="space-y-4">
            {evalArray.map((item, index) => (
              <div key={item.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-lg text-gray-800">{item.title}</h4>
                <p className="text-gray-600 mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const evaluationFocusQuestion = questions.find(q => q.title === "What is the primary focus of your planning project?"); // Will need to be adapted
    let evaluationFocusText = "OQI evaluation";
    if (evaluationFocusQuestion) {
        const answerValue = formData[evaluationFocusQuestion.id];
        if (answerValue) {
            const selectedOption = (evaluationFocusQuestion.options || []).find(opt => opt.value === answerValue);
            if (selectedOption) {
                evaluationFocusText = selectedOption.label;
            }
        }
    }

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div id="results-printable" className="pdf-content">
            {/* GESDA Header */}
            <div className="text-center mb-8 border-b border-gray-200 pb-6">
              <div>
                <h1 className="text-3xl font-bold text-purple-600">GESDA OQI Evaluation Report</h1>
                <p className="text-sm text-gray-500">GESDA Partnership Initiative</p>
              </div>
              <p className="mt-2 text-gray-600">
                A comprehensive evaluation for the <strong className="text-purple-700">
                  {evaluationFocusText}
                </strong>.
              </p>
              <p className="text-sm text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            {/* Co-Benefits (will need to be adapted for OQI context) */}
            {evaluationResults.coBenefits.size > 0 && (
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Key Evaluation Aspects</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Array.from(evaluationResults.coBenefits).map(benefit => (
                    <div key={benefit} className="text-center p-3 bg-white rounded-lg">
                      <span className="text-2xl">{benefitsMap[benefit]?.icon}</span>
                      <p className="text-sm font-medium mt-1">{benefitsMap[benefit]?.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {getEvaluationSection('Scientific Relevance', evaluationResults.scientific_relevance)}
            {getEvaluationSection('Impact Relevance', evaluationResults.impact_relevance)}
            {getEvaluationSection('Resource Efficiency', evaluationResults.resource_efficiency)}
            {getEvaluationSection('Business Model & Sustainability', evaluationResults.business_model)}
            {getEvaluationSection('Community Profile', evaluationResults.community_profile)}
            {getEvaluationSection('Community Support & Influence', evaluationResults.community_support)}

            {/* AI Summary Section */}
            <OQIEvaluationSummary evaluationResults={evaluationResults} evaluationFocusText={evaluationFocusText} />

            {/* GESDA Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>This evaluation report is developed in partnership with GESDA</p>
              <p>Supporting global science diplomacy and quantum initiatives</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 no-print">
            <button
              id="download-pdf-btn"
              onClick={downloadPDF}
              className="w-full sm:w-auto bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <Download size={18} className="mr-2" />
              Download PDF
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentStep(1);
                setFormData({});
              }}
              className="w-full sm:w-auto bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {showPublicResources && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <PublicResourcesDisplay />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowPublicResources(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {currentQuestions.map(question => (
            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {question.title}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {question.description && (
                  <p className="text-gray-600 text-sm">{question.description}</p>
                )}
              </div>
              {renderQuestion(question)}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} className="mr-2" />
            Previous
          </button>

          <button
            onClick={() => setShowPublicResources(true)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            title="View Additional Resources"
          >
            <Info size={18} className="mr-2" />
            Resources
          </button>

          {currentStep === totalSteps ? (
            <button
              onClick={handleSubmit}
              className="flex items-center bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <Send size={18} className="mr-2" />
              Generate Evaluation Report
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Next
              <ChevronRight size={20} className="ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedQuestionnaire;