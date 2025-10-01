import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi'; // Corrected this line
import { supabase } from '../../integrations/supabase/client';
import html2pdf from 'html2pdf.js'; // Import html2pdf.js
import SuggestionSystem from './SuggestionSystem'; // Ensure SuggestionSystem is imported

const { FiChevronLeft, FiChevronRight, FiSend, FiDownload } = FiIcons; // Removed FiPrinter

const EnhancedQuestionnaire = ({ user }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [questions, setQuestions] = useState([]);
  const [recommendationItems, setRecommendationItems] = useState([]);
  const [questionRecommendationMappings, setQuestionRecommendationMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);

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

        // Fetch recommendation items
        const { data: recItemsData, error: recItemsError } = await supabase
          .from('recommendation_items')
          .select('*');
        if (recItemsError) throw recItemsError;
        setRecommendationItems(recItemsData);

        // Fetch question-recommendation mappings
        const { data: mappingsData, error: mappingsError } = await supabase
          .from('question_recommendation_mappings')
          .select('*');
        if (mappingsError) throw mappingsError;
        setQuestionRecommendationMappings(mappingsData);

      } catch (err) {
        console.error('Error fetching questionnaire data:', err.message);
        setError('Failed to load questionnaire. Please try again.');
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
      const generatedRecs = generateRecommendations(formData);
      setRecommendations(generatedRecs);
      setShowResults(true);
    } catch (err) {
      console.error('Error generating recommendations:', err.message);
      setError('Failed to generate action plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = (data) => {
    const recs = {
      strategic_notes: [],
      policy: [],
      design: [],
      collaboration: [],
      coBenefits: new Set()
    };

    // Iterate through user's answers and find matching recommendations
    for (const questionId in data) {
      const answerValue = data[questionId];
      
      // Handle checkbox (multi-select) answers
      const answerValues = Array.isArray(answerValue) ? answerValue : [answerValue];

      answerValues.forEach(val => {
        const relevantMappings = questionRecommendationMappings.filter(
          mapping => mapping.question_id === questionId && mapping.answer_value === val
        );

        relevantMappings.forEach(mapping => {
          const recommendation = recommendationItems.find(item => item.id === mapping.recommendation_item_id);
          if (recommendation) {
            // Categorize recommendations based on their type
            switch (recommendation.type) {
              case 'strategic_note':
                recs.strategic_notes.push(recommendation);
                break;
              case 'policy':
                recs.policy.push(recommendation);
                break;
              case 'design':
                recs.design.push(recommendation);
                break;
              case 'collaboration':
                recs.collaboration.push(recommendation);
                break;
              default:
                // Add to a generic category if type is unknown
                recs.policy.push(recommendation); 
            }
            // Add co-benefits
            if (recommendation.benefits) {
              recommendation.benefits.forEach(benefit => recs.coBenefits.add(benefit));
            }
          }
        });
      });
    }

    return recs;
  };

  const downloadPDF = () => {
    const element = document.getElementById('results-printable');
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5], // Top, Left, Bottom, Right margins in inches
      filename: `un-habitat-aedes-action-plan-${new Date().toISOString().split('T')[0]}.pdf`,
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
    const options = question.options || []; // Ensure options is an array

    switch (question.type) {
      case 'radio':
        return (
          <div className="space-y-3">
            {options.map((option, index) => (
              <label
                key={index}
                className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-cyan-50 transition-colors"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  className="mt-1 h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"
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
                className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-cyan-50"
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
                  className="mt-1 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questionnaire data...</p>
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

  if (showResults && recommendations) {
    const benefitsMap = {
      'Health': { icon: '❤️', text: 'Health & Well-being' },
      'Economy': { icon: '💰', text: 'Economic Growth' },
      'Environment': { icon: '🌳', text: 'Urban Environment' },
      'Social': { icon: '🤝', text: 'Community & Equity' },
      'Institutional': { icon: '🏛️', text: 'Governance' }
    };

    const getRecommendationSection = (title, recsArray) => {
      if (!recsArray || recsArray.length === 0) return null;
      return (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-cyan-700 mb-4 border-b-2 border-cyan-200 pb-2">
            {title}
          </h3>
          <div className="space-y-4">
            {recsArray.map((rec, index) => (
              <div key={rec.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-lg text-gray-800">{rec.title}</h4>
                <p className="text-gray-600 mt-1">{rec.text}</p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div id="results-printable" className="pdf-content"> {/* Apply pdf-content class here */}
            {/* UN-HABITAT Header */}
            <div className="text-center mb-8 border-b border-gray-200 pb-6">
              <div className="flex items-center justify-center mb-4">
                {/* Removed UN-HABITAT Logo */}
                <div>
                  <h1 className="text-3xl font-bold text-cyan-600">Urban Planner's Action Plan</h1>
                  <p className="text-sm text-gray-500">UN-HABITAT Partnership Initiative</p>
                </div>
              </div>
              <p className="mt-2 text-gray-600">
                A prioritized action plan for your <strong className="text-cyan-700">
                  {formData.planning_focus?.replace(/_/g, ' ')}
                </strong> project.
              </p>
              <p className="text-sm text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            {/* Co-Benefits */}
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-4">Primary Co-Benefits of Your Plan</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from(recommendations.coBenefits).map(benefit => (
                  <div key={benefit} className="text-center p-3 bg-white rounded-lg">
                    <span className="text-2xl">{benefitsMap[benefit]?.icon}</span>
                    <p className="text-sm font-medium mt-1">{benefitsMap[benefit]?.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {getRecommendationSection('Strategic Notes', recommendations.strategic_notes)}
            {getRecommendationSection('Recommended Policy & Regulatory Actions', recommendations.policy)}
            {getRecommendationSection('Recommended Design & Infrastructure Interventions', recommendations.design)}
            {getRecommendationSection('Recommended Collaboration & Process Improvements', recommendations.collaboration)}

            {/* UN-HABITAT Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>This action plan is developed in partnership with UN-HABITAT</p>
              <p>Supporting sustainable urban development and public health integration worldwide</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 no-print">
            <button
              id="download-pdf-btn"
              onClick={downloadPDF}
              className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <SafeIcon icon={FiDownload} className="mr-2" />
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
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
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
              {/* Suggestion System for reviewers/editors */}
              {user && ['reviewer', 'editor', 'admin'].includes(user.role) && (
                <SuggestionSystem
                  questionId={question.id}
                  questionTitle={question.title}
                  user={user}
                />
              )}
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
            <SafeIcon icon={FiChevronLeft} className="mr-2" />
            Previous
          </button>

          {currentStep === totalSteps ? (
            <button
              onClick={handleSubmit}
              className="flex items-center bg-cyan-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
            >
              <SafeIcon icon={FiSend} className="mr-2" />
              Generate Action Plan
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Next
              <SafeIcon icon={FiChevronRight} className="ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedQuestionnaire;