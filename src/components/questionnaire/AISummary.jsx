import React from 'react';
import { Sparkles } from 'lucide-react';

const AISummary = ({ recommendations, planningFocusText }) => {
  const { policy, design, collaboration, coBenefits } = recommendations;

  const renderRecsList = (recs) => {
    if (!recs || recs.length === 0) return null;
    // Take up to two recommendations and quote them for emphasis
    return recs.slice(0, 2).map(r => `"${r.title}"`).join(' and ');
  };

  const policyText = renderRecsList(policy);
  const designText = renderRecsList(design);
  const collaborationText = renderRecsList(collaboration);

  return (
    <div className="mt-8 p-6 bg-cyan-50 border border-cyan-200 rounded-lg">
      <div className="flex items-center mb-4">
        <Sparkles className="w-8 h-8 text-cyan-600 mr-3" />
        <h3 className="text-2xl font-bold text-cyan-700">
          AI-Powered Summary & Key Actions
        </h3>
      </div>
      <div className="space-y-4 text-gray-700">
        <p>
          Based on your input for the <strong>{planningFocusText}</strong> project, here are the key strategic actions to integrate public health and create a resilient, mosquito-free urban environment.
        </p>
        {policyText && (
          <p>
            For <strong>Policy & Regulation</strong>, the priority is to focus on actions like {policyText}. This will build a strong regulatory foundation for sustainable change.
          </p>
        )}
        {designText && (
          <p>
            In <strong>Design & Infrastructure</strong>, the most impactful interventions will be {designText}. These are critical for eliminating mosquito breeding sites through smart urban planning.
          </p>
        )}
        {collaborationText && (
          <p>
            To ensure success through <strong>Collaboration</strong>, it's essential to work on initiatives such as {collaborationText}. Engaging diverse stakeholders will be key to a holistic and effective response.
          </p>
        )}
        {coBenefits.size > 0 && (
          <p>
            By implementing this plan, you will unlock significant co-benefits in areas like <strong>{Array.from(coBenefits).join(', ')}</strong>, fostering a healthier, more equitable, and prosperous community.
          </p>
        )}
      </div>
    </div>
  );
};

export default AISummary;