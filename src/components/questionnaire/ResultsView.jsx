import React from 'react';
import { Download } from 'lucide-react';
import OQIEvaluationSummary from './OQIEvaluationSummary';
import { Button } from '@/components/ui/button';
import html2pdf from 'html2pdf.js';

const ResultsView = ({ evaluationResults, userInfo, onStartOver }) => {
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
          <Button onClick={onStartOver} variant="secondary" className="w-full sm:w-auto">Start Over</Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;