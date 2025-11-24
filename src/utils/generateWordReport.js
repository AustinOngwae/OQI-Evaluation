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
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        datalabels: { display: true, anchor: 'end', align: 'top' }
      },
      scales: {
        yAxes: [{
          ticks: { beginAtZero: true, precision: 0 }
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
      text: "OQI Questionnaire Analysis Report",
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
        new TextRun({ text: "Total Submissions: ", bold: true }),
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
      text: "This document provides an analysis of the responses collected via the Open Quantum Institute (OQI) questionnaire. It includes statistical breakdowns and visual representations of the data where applicable.",
      spacing: { after: 400 },
    }),
  ];

  // 2. Question Analysis Sections
  const questionSections = [];

  // Use for...of loop to handle async/await for chart generation
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
          text: question.description,
          style: "Intense Quote",
          italics: true,
          spacing: { after: 200 },
        })
      );
    }

    // Calculate Stats if applicable
    if (['radio', 'select', 'checkbox'].includes(question.type)) {
      const counts = {};
      const comments = [];
      
      // Initialize counts
      (question.options || []).forEach(opt => {
        counts[opt.value] = { label: opt.label, count: 0 };
      });

      // Aggregate data
      submissions.forEach(sub => {
        const answerData = sub.answers[question.id];
        if (answerData) {
          // Count answers
          if (answerData.answer) {
            const vals = Array.isArray(answerData.answer) ? answerData.answer : [answerData.answer];
            vals.forEach(val => {
              if (counts[val]) counts[val].count++;
              else {
                if (!counts[val]) counts[val] = { label: val, count: 1 };
                else counts[val].count++;
              }
            });
          }
          // Collect comments
          if (answerData.comment) {
            comments.push(answerData.comment);
          }
        }
      });

      // Prepare Chart Data
      const labels = [];
      const data = [];
      Object.values(counts).forEach(item => {
        // Truncate long labels for chart clarity
        let label = item.label || "Unknown";
        if (label.length > 25) label = label.substring(0, 25) + '...';
        labels.push(label);
        data.push(item.count);
      });

      // Generate Chart Image
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

      // Create Data Table
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Option", bold: true })], width: { size: 50, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: "Count", bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: "Percentage", bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
          ],
          tableHeader: true,
        }),
      ];

      Object.values(counts).forEach(item => {
        const percentage = totalSubmissions > 0 ? ((item.count / totalSubmissions) * 100).toFixed(1) + '%' : '0%';
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

      // Comments Section
      if (comments.length > 0) {
        questionSections.push(
          new Paragraph({
            text: "Comments / Notes:",
            bold: true,
            spacing: { before: 200, after: 100 },
          })
        );
        comments.forEach(comment => {
          questionSections.push(
            new Paragraph({
              text: `• "${comment}"`,
              spacing: { after: 50 },
            })
          );
        });
      }

    } else {
      // Text questions
      questionSections.push(
        new Paragraph({
          text: "Free text responses:",
          italics: true,
        })
      );
      
      const textAnswers = submissions
        .map(s => s.answers[question.id]?.answer)
        .filter(a => a);
        
      if (textAnswers.length > 0) {
        // Show up to 5 samples
        textAnswers.slice(0, 5).forEach(ans => {
             questionSections.push(
            new Paragraph({
              text: `• "${ans}"`,
              spacing: { after: 50 },
            })
          );
        });
        if (textAnswers.length > 5) {
             questionSections.push(
            new Paragraph({
              text: `... and ${textAnswers.length - 5} more responses (see CSV).`,
              italics: true,
              spacing: { before: 50 },
            })
          );
        }
      } else {
          questionSections.push(
            new Paragraph({
              text: `No text responses provided.`,
              italics: true,
            })
          );
      }
    }
    
    // Add spacing after each question block
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
  saveAs(blob, `OQI_Analysis_Report_${new Date().toISOString().split('T')[0]}.docx`);
};