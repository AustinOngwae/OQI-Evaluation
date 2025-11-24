import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

// Helper to fetch chart image from QuickChart.io
const getChartImage = async (labels, data) => {
  const chartConfig = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Responses',
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        datalabels: { 
          display: true, 
          anchor: 'end', 
          align: 'top',
          font: { weight: 'bold' } 
        }
      },
      scales: {
        yAxes: [{
          ticks: { beginAtZero: true, precision: 0 }
        }],
        xAxes: [{
          ticks: { autoSkip: false }
        }]
      }
    }
  };

  const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300&bkg=white`;
  
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (error) {
    console.error("Error generating chart:", error);
    return null;
  }
};

// Helper to generate narrative discussion based on data statistics
const generateDiscussionText = (questionTitle, counts, total) => {
  if (total === 0) return "No data available for analysis.";

  // Sort counts to find top and bottom
  const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const topPercentage = ((top.count / total) * 100).toFixed(1);
  
  let narrative = `Analysis of the responses for "${questionTitle}" reveals distinct patterns in the participant feedback. `;
  
  // Consensus analysis
  if (parseFloat(topPercentage) > 50) {
    narrative += `A significant majority of respondents (${topPercentage}%) aligned with the option "${top.label}". This indicates a strong consensus within the group regarding this specific aspect. The dominance of this choice suggests it is the primary driver or preference among the surveyed population. `;
  } else if (parseFloat(topPercentage) > 30) {
    narrative += `The responses show a distributed preference, with "${top.label}" emerging as the most frequent choice at ${topPercentage}%, though it did not secure an absolute majority. This fragmentation suggests diverse perspectives or needs among the respondents. `;
  } else {
    narrative += `The data indicates a highly fragmented set of responses, with no single option dominating the results. The leading choice, "${top.label}", only garnered ${topPercentage}% of the total, pointing to a lack of uniformity in the participants' views or experiences. `;
  }

  // Secondary analysis if exists
  if (sorted.length > 1) {
    const second = sorted[1];
    const secondPercentage = ((second.count / total) * 100).toFixed(1);
    const diff = (top.count - second.count);
    
    if (diff === 0) {
       narrative += `Interestingly, there is a tie for the top position, with "${second.label}" also receiving an equal share of engagement. This parallelism highlights a clear split in opinion or applicability between these two primary factors. `;
    } else if ((top.count - second.count) / total < 0.1) {
       narrative += `Closely following the top choice is "${second.label}" with ${secondPercentage}%. The narrow margin between these top two options suggests they are competing priorities for the respondents. `;
    }
  }

  // Minority analysis
  if (bottom.count === 0) {
    narrative += `It is worth noting that the option "${bottom.label}" received no selections, indicating it may be irrelevant or low-priority for this specific cohort. `;
  } else if (sorted.length > 2) {
    narrative += `Conversely, "${bottom.label}" represents the minority view in this context, selected by only a small fraction of participants. `;
  }

  narrative += "Overall, these distributions provide critical insight into the current state of the ecosystem as reflected by the questionnaire participants.";

  return narrative;
};

export const generateWordReport = async (submissions, questions) => {
  if (!submissions || submissions.length === 0) {
    alert('No submissions to export.');
    return;
  }

  // Filter out potential "dummy" questions and sort
  const validQuestions = questions
    .filter(q => q.title && q.title.trim() !== '')
    .sort((a, b) => a.step_id - b.step_id || a.title.localeCompare(b.title));

  const totalSubmissions = submissions.length;
  const dateStr = new Date().toLocaleDateString();

  // 1. Title Section
  const titleSection = [
    new Paragraph({
      text: "OQI Questionnaire Comprehensive Analysis Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Generated on: ", bold: true }),
        new TextRun(dateStr),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Total Submissions Analyzed: ", bold: true }),
        new TextRun(String(totalSubmissions)),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
    }),
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: "This document serves as a comprehensive analysis of the data collected via the Open Quantum Institute (OQI) questionnaire. The primary objective of this report is to interpret the aggregated responses to identify key trends, consensus points, and areas of divergence among stakeholders.",
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "The following sections provide a detailed breakdown for each question. For quantitative inquiries, statistical distributions are accompanied by visual charts and narrative interpretations of the findings. Qualitative feedback is also summarized to provide context to the numerical data.",
      spacing: { after: 400 },
    }),
  ];

  // 2. Question Analysis Sections
  const questionSections = [];

  for (const [index, question] of validQuestions.entries()) {
    
    questionSections.push(
      new Paragraph({
        text: `${index + 1}. ${question.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    if (question.description) {
      questionSections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Context: ", bold: true }),
            new TextRun({ text: question.description, italics: true }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Calculate Stats if applicable
    if (['radio', 'select', 'checkbox'].includes(question.type)) {
      const counts = {};
      const comments = [];
      
      // Initialize counts with labels
      (question.options || []).forEach(opt => {
        counts[opt.value] = { label: opt.label, count: 0 };
      });

      // Aggregate data
      let questionResponseCount = 0;
      submissions.forEach(sub => {
        const answerData = sub.answers[question.id];
        if (answerData) {
          if (answerData.answer) {
            const vals = Array.isArray(answerData.answer) ? answerData.answer : [answerData.answer];
            if (vals.length > 0) questionResponseCount++;
            vals.forEach(val => {
              if (counts[val]) counts[val].count++;
              else {
                if (!counts[val]) counts[val] = { label: val, count: 1 };
                else counts[val].count++;
              }
            });
          }
          if (answerData.comment) {
            comments.push(answerData.comment);
          }
        }
      });

      // --- Discussion & Findings Section ---
      questionSections.push(
        new Paragraph({
          text: "Discussion of Results",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        })
      );

      const discussionText = generateDiscussionText(question.title, counts, questionResponseCount);
      questionSections.push(
        new Paragraph({
          text: discussionText,
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200 },
        })
      );

      // --- Visual Data Representation ---
      // Prepare Chart Data
      const labels = [];
      const data = [];
      Object.values(counts).forEach(item => {
        let label = item.label || "Unknown";
        if (label.length > 30) label = label.substring(0, 30) + '...';
        labels.push(label);
        data.push(item.count);
      });

      const imageBuffer = await getChartImage(labels, data);
      
      if (imageBuffer) {
        questionSections.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 450,
                  height: 270,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
      }

      // --- Detailed Statistics Table ---
      questionSections.push(
        new Paragraph({
          text: "Detailed Statistics",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        })
      );

      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Response Option", bold: true })], width: { size: 50, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: "Count", bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: "Percentage", bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
          ],
          tableHeader: true,
        }),
      ];

      Object.values(counts).forEach(item => {
        const percentage = questionResponseCount > 0 ? ((item.count / questionResponseCount) * 100).toFixed(1) + '%' : '0.0%';
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(item.label || "Unknown")] }),
              new TableCell({ children: [new Paragraph(String(item.count))] }),
              new TableCell({ children: [new Paragraph(percentage)] }),
            ],
          })
        );
      });

      questionSections.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      // --- Qualitative Feedback ---
      if (comments.length > 0) {
        questionSections.push(
          new Paragraph({
            text: "Qualitative Feedback & Notes",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );
        questionSections.push(
            new Paragraph({
              text: "Participants provided the following additional context regarding their selections:",
              spacing: { after: 100 },
            })
        );
        comments.forEach(comment => {
          questionSections.push(
            new Paragraph({
              children: [
                 new TextRun({ text: "• ", bold: true }),
                 new TextRun({ text: comment, italics: true }),
              ],
              spacing: { after: 50 },
            })
          );
        });
      }

    } else {
      // Text questions
       questionSections.push(
        new Paragraph({
          text: "Qualitative Response Analysis",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        })
      );
      
      const textAnswers = submissions
        .map(s => s.answers[question.id]?.answer)
        .filter(a => a);
        
      if (textAnswers.length > 0) {
        questionSections.push(
          new Paragraph({
            text: `This open-ended inquiry elicited ${textAnswers.length} responses. The following selection provides a representative sample of the input received from participants. These responses highlight individual perspectives that may not be captured by quantitative metrics.`,
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 100 },
          })
        );
        
        // Show up to 10 samples for text since description is important
        textAnswers.slice(0, 10).forEach(ans => {
             questionSections.push(
            new Paragraph({
              children: [
                 new TextRun({ text: "• ", bold: true }),
                 new TextRun({ text: ans }),
              ],
              spacing: { after: 80 },
            })
          );
        });
        
        if (textAnswers.length > 10) {
             questionSections.push(
            new Paragraph({
              text: `(Note: ${textAnswers.length - 10} additional responses are available in the raw data export.)`,
              italics: true,
              spacing: { before: 50 },
            })
          );
        }
      } else {
          questionSections.push(
            new Paragraph({
              text: `No textual responses were recorded for this item in the current dataset.`,
              italics: true,
            })
          );
      }
    }
    
    // Add page break or large spacing after each question block
    questionSections.push(new Paragraph({ text: "", spacing: { after: 400 } }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...titleSection,
          ...questionSections,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `OQI_Comprehensive_Analysis_${new Date().toISOString().split('T')[0]}.docx`);
};