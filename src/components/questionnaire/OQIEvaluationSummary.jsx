import React from 'react';
import { Sparkles } from 'lucide-react';

const OQIEvaluationSummary = ({ evaluationResults, evaluationFocusText }) => {
  const { scientific_relevance, impact_relevance, efficient_use_of_resources, business_model_sustainability, profile_of_oqi_community, support_influence_quantum_community, keyEvaluationAspects } = evaluationResults;

  const renderEvalList = (items) => {
    if (!items || items.length === 0) return null;
    return items.slice(0, 2).map(r => `"${r.title}"`).join(' and ');
  };

  const scientificText = renderEvalList(scientific_relevance);
  const impactText = renderEvalList(impact_relevance);
  const efficientResourcesText = renderEvalList(efficient_use_of_resources);
  const businessModelText = renderEvalList(business_model_sustainability);
  const communityProfileText = renderEvalList(profile_of_oqi_community);
  const communitySupportText = renderEvalList(support_influence_quantum_community);

  const evaluationAspectsMap = {
    'Quality and impact of results': { icon: '✨', text: 'Quality & Impact of Results' },
    'Cost and sustainability': { icon: '💰', text: 'Cost & Sustainability' },
    'Multi-stakeholder support': { icon: '🤝', text: 'Multi-stakeholder Support' },
  };

  return (
    <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-center mb-4">
        <Sparkles className="w-8 h-8 text-purple-600 mr-3" />
        <h3 className="text-2xl font-bold text-purple-700">
          OQI Evaluation Summary & Key Insights
        </h3>
      </div>
      <div className="space-y-4 text-gray-700">
        <p>
          Based on your input for the <strong>{evaluationFocusText}</strong>, here are the key insights regarding the Open Quantum Initiative (OQI).
        </p>
        {scientificText && (
          <p>
            Regarding <strong>Scientific Relevance</strong>, the evaluation highlights aspects such as {scientificText}. This indicates the OQI's adherence to state-of-the-art scientific methods and its contribution to scientific progress.
          </p>
        )}
        {impactText && (
          <p>
            For <strong>Impact Relevance</strong>, key contributions include {impactText}. These actions demonstrate OQI's progress towards global goals and quantum readiness, especially in underserved regions.
          </p>
        )}
        {efficientResourcesText && (
          <p>
            In terms of <strong>Efficient Use of Resources</strong>, the evaluation points to {efficientResourcesText}. This reflects the OQI's management of resources during the pilot phase.
          </p>
        )}
        {businessModelText && (
          <p>
            Concerning the <strong>Business Model & Sustainable Funding</strong>, insights suggest {businessModelText}. This addresses the prospects for financial sustainability post-pilot.
          </p>
        )}
        {communityProfileText && (
          <p>
            The <strong>Profile of the OQI Community</strong> indicates {communityProfileText}. This covers the multi-stakeholder and geographical representation of the community.
          </p>
        )}
        {communitySupportText && (
          <p>
            Finally, the <strong>Support of, and Influence on the Quantum Community</strong> shows {communitySupportText}. This reflects the quantum community's endorsement and recognition of OQI.
          </p>
        )}
        {keyEvaluationAspects.size > 0 && (
          <p>
            Overall, the OQI's activities are evaluated across key aspects including{' '}
            <strong>{Array.from(keyEvaluationAspects).map(b => evaluationAspectsMap[b]?.text || b).join(', ')}</strong>,
            fostering a more inclusive and impactful quantum ecosystem.
          </p>
        )}
      </div>
    </div>
  );
};

export default OQIEvaluationSummary;