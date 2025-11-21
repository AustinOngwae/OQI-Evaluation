import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { X, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import OQIEvaluationSummary from '../questionnaire/OQIEvaluationSummary';

const SubmissionDetailsModal = ({ submission, questions, evaluationItems, questionEvaluationMappings, onClose }) => {
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!submission) return null;

  const { user_context, answers, created_at } = submission;

  const generateEvaluationResults = () => {
    const toastId = toast.loading('Generating Report...');
    try {
      const data = submission.answers;
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
      setEvaluationResults(results);
      toast.success('Report generated.', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate report.', { id: toastId });
      console.error("Error generating report:", err);
    }
  };

  const downloadPDF = () => {
    const element = document.getElementById('admin-report-printable');
    const submitterName = `${user_context?.firstName}-${user_context?.lastName}`.toLowerCase() || 'submission';
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `gesda-oqi-report-${submitterName}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    setIsGenerating(true);
    html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
    }).catch(error => {
      console.error('PDF generation failed:', error);
      setIsGenerating(false);
      alert('PDF generation failed. Please try again.');
    });
  };

  const getAnswerDisplay = (question) => {
    const answerData = answers[question.id];
    if (!answerData || !answerData.answer) {
      return <span className="text-gray-400 italic">No answer provided</span>;
    }

    let displayValue = answerData.answer;
    if (Array.isArray(displayValue)) {
      const labels = displayValue.map(val => {
        const option = question.options?.find(opt => opt.value === val);
        return option ? option.label : val;
      });
      return labels.join(', ');
    } else if (question.type === 'radio' || question.type === 'select') {
      const option = question.options?.find(opt => opt.value === displayValue);
      displayValue = option ? option.label : displayValue;
    }

    return <span className="text-white">{String(displayValue)}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-3">
          <h2 className="text-xl font-bold text-white font-sans">Submission Details</h2>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {!evaluationResults && (
              <button onClick={generateEvaluationResults} className="btn-primary text-xs sm:text-sm flex items-center">
                Generate Report
              </button>
            )}
            {evaluationResults && (
              <button id="download-pdf-btn" onClick={downloadPDF} disabled={isGenerating} className="btn-secondary text-xs sm:text-sm flex items-center">
                {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Download size={16} className="mr-2" />}
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto pr-2">
          <div id="admin-report-printable" className="admin-printable-content">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-brand-primary mb-2 font-sans">Submitter Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm font-body">
                <p><strong>Name:</strong> {user_context?.firstName} {user_context?.lastName}</p>
                <p><strong>Job Title:</strong> {user_context?.jobTitle || 'N/A'}</p>
                <p><strong>Organization:</strong> {user_context?.organization || 'N/A'}</p>
                <p><strong>Location:</strong> {user_context?.location || 'N/A'}</p>
                <p className="md:col-span-2"><strong>Qualifications:</strong> {user_context?.qualifications || 'N/A'}</p>
                <p className="md:col-span-2"><strong>Submitted On:</strong> {new Date(created_at).toLocaleString()}</p>
              </div>
            </div>

            {evaluationResults && (
              <div className="mt-8 pt-6 border-t border-gray-300">
                <OQIEvaluationSummary 
                  evaluationResults={evaluationResults} 
                  evaluationFocusText={`${user_context?.firstName || 'User'}'s OQI pilot evaluation`} 
                />
              </div>
            )}
          </div>

          <div className="no-print">
            <h3 className="text-lg font-semibold text-brand-primary mb-3 mt-6 font-sans">Evaluation Answers</h3>
            <div className="space-y-4">
              {questions.sort((a, b) => a.step_id - b.step_id).map(question => (
                <div key={question.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <p className="font-semibold text-gray-200 font-sans">{question.title}</p>
                  <div className="pl-4 mt-1">
                    <p className="text-sm font-body"><strong className="text-gray-400">Answer:</strong> {getAnswerDisplay(question)}</p>
                    {answers[question.id]?.comment && (
                      <p className="text-sm mt-1 font-body"><strong className="text-gray-400">Comment:</strong> <span className="text-gray-300 italic">"{answers[question.id].comment}"</span></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailsModal;