import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import SuggestionSystem from './SuggestionSystem';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiChevronLeft, FiChevronRight, FiSend, FiDownload, FiPrinter } = FiIcons;

const EnhancedQuestionnaire = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    // Load questions from localStorage (edited by editors) or use defaults
    const stored = localStorage.getItem('questionnaire_questions');
    if (stored) {
      setQuestions(JSON.parse(stored));
    } else {
      setQuestions(getDefaultQuestions());
    }
  };

  const getDefaultQuestions = () => {
    return [
      {
        id: 'planning_focus',
        stepId: 1,
        type: 'radio',
        title: 'What is the primary focus of your current planning effort?',
        description: 'Define the scope of your work and the local public health context.',
        required: true,
        options: [
          {
            value: 'new_development',
            label: 'New Development / Master Plan',
            description: 'Designing a new district or large-scale project.'
          },
          {
            value: 'retrofitting',
            label: 'Retrofitting / Urban Regeneration',
            description: 'Upgrading an existing neighborhood.'
          },
          {
            value: 'policy',
            label: 'City-Wide Policy & Zoning',
            description: 'Developing comprehensive plans or codes.'
          }
        ]
      },
      {
        id: 'transmission_level',
        stepId: 1,
        type: 'select',
        title: 'What is the current Aedes-borne disease situation?',
        required: true,
        options: [
          { value: 'epidemic', label: 'Epidemic Transmission (Regular, large-scale outbreaks)' },
          { value: 'seasonal', label: 'Regular Seasonal Transmission (Predictable annual increases)' },
          { value: 'sporadic', label: 'Sporadic Transmission (Occasional, isolated cases)' },
          { value: 'present_no_local', label: 'Aedes Present, No Local Transmission (Vector is present)' },
          { value: 'no_aedes', label: 'No Aedes present (Preventative planning)' }
        ]
      },
      {
        id: 'region',
        stepId: 2,
        type: 'select',
        title: 'Which region best describes your planning area?',
        required: true,
        options: [
          { value: 'asia_pacific', label: 'Asia-Pacific' },
          { value: 'americas', label: 'The Americas (South, Central, North)' },
          { value: 'africa', label: 'Africa' },
          { value: 'europe_middle_east', label: 'Europe / Middle East (areas with emerging risk)' }
        ]
      },
      {
        id: 'budget',
        stepId: 2,
        type: 'radio',
        title: 'What is the approximate budget for this initiative?',
        required: true,
        options: [
          {
            value: 'high',
            label: 'Well-funded',
            description: 'Dedicated budget for capital projects and new programs.'
          },
          {
            value: 'medium',
            label: 'Limited',
            description: 'Funding for operational costs or small grants.'
          },
          {
            value: 'low',
            label: 'Minimal / Unfunded',
            description: 'Must rely on existing resources and no-cost policy changes.'
          }
        ]
      }
    ];
  };

  const handleInputChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    const currentQuestions = questions.filter(q => q.stepId === currentStep);
    const requiredQuestions = currentQuestions.filter(q => q.required);

    // Validate required fields
    const isValid = requiredQuestions.every(q => {
      const value = formData[q.id];
      if (q.type === 'checkbox') {
        return Array.isArray(value) && value.length > 0;
      }
      return value && value.trim() !== '';
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
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate recommendations based on form data
    const recs = generateRecommendations(formData);
    setRecommendations(recs);
    setShowResults(true);
    setLoading(false);
  };

  const generateRecommendations = (data) => {
    const recs = {
      strategic_notes: [],
      policy: [],
      design: [],
      collaboration: [],
      coBenefits: new Set()
    };

    // Add recommendations based on form data
    if (data.budget === 'low') {
      recs.strategic_notes.push({
        title: 'Focus on Low-Cost, High-Impact Actions',
        text: 'With a minimal budget, your focus should be on policy, collaboration, and community mobilization. These foundational changes can be highly effective and build the case for future investment in infrastructure.'
      });
    }

    if (data.region === 'africa') {
      recs.strategic_notes.push({
        title: 'Special Consideration for Africa',
        text: 'The document highlights that Africa may be in the earlier stages of dengue emergence. Proactive urban planning now is critical to prevent the large-scale epidemics seen elsewhere. Your efforts have a generational impact potential.'
      });
    }

    // Add sample policy recommendations
    recs.policy.push({
      title: 'Update Construction Site Regulations',
      text: 'Implement and enforce regulations requiring developers to manage water accumulation on construction sites. This is a high-impact, low-cost policy change.',
      benefits: ['Institutional', 'Health']
    });

    recs.collaboration.push({
      title: 'Establish a "Healthy Cities" Task Force',
      text: 'Formally establish a working group with standing members from Planning, Public Works, Health, and Environment to coordinate on policies and projects.',
      benefits: ['Institutional']
    });

    // Calculate co-benefits
    [...recs.policy, ...recs.design, ...recs.collaboration].forEach(rec => {
      if (rec.benefits) {
        rec.benefits.forEach(benefit => recs.coBenefits.add(benefit));
      }
    });

    return recs;
  };

  const downloadPDF = () => {
    // This would integrate with the existing PDF generation logic
    alert('PDF download functionality will be implemented with the existing html2pdf.js integration');
  };

  const printReport = () => {
    window.print();
  };

  const renderQuestion = (question) => {
    const value = formData[question.id];

    switch (question.type) {
      case 'radio':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
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
            {question.options.map((option, index) => (
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
            {question.options.map((option, index) => (
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

  const currentQuestions = questions.filter(q => q.stepId === currentStep);
  const totalSteps = Math.max(...questions.map(q => q.stepId), 1);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized action plan...</p>
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

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* UN-HABITAT Header */}
          <div className="text-center mb-8 border-b border-gray-200 pb-6">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1759320275254-Logo-UN-Habitat.jpg" 
                alt="UN-HABITAT Logo" 
                className="h-16 w-auto mr-4"
              />
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

          {/* Recommendations Sections */}
          {recommendations.strategic_notes.length > 0 && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-cyan-700 mb-4 border-b-2 border-cyan-200 pb-2">
                Strategic Notes
              </h3>
              <div className="space-y-4">
                {recommendations.strategic_notes.map((note, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-lg text-gray-800">{note.title}</h4>
                    <p className="text-gray-600 mt-1">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.policy.length > 0 && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-cyan-700 mb-4 border-b-2 border-cyan-200 pb-2">
                Recommended Policy & Regulatory Actions
              </h3>
              <div className="space-y-4">
                {recommendations.policy.map((rec, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-lg text-gray-800">{rec.title}</h4>
                    <p className="text-gray-600 mt-1">{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.collaboration.length > 0 && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-cyan-700 mb-4 border-b-2 border-cyan-200 pb-2">
                Recommended Collaboration & Process Improvements
              </h3>
              <div className="space-y-4">
                {recommendations.collaboration.map((rec, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-lg text-gray-800">{rec.title}</h4>
                    <p className="text-gray-600 mt-1">{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={downloadPDF}
              className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <SafeIcon icon={FiDownload} className="mr-2" />
              Download PDF
            </button>
            <button
              onClick={printReport}
              className="w-full sm:w-auto bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <SafeIcon icon={FiPrinter} className="mr-2" />
              Print Report
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

          {/* UN-HABITAT Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>This action plan is developed in partnership with UN-HABITAT</p>
            <p>Supporting sustainable urban development and public health integration worldwide</p>
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