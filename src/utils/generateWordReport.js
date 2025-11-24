import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  HeadingLevel, 
  AlignmentType, 
  ImageRun, 
  Header, 
  Footer, 
  PageNumber, 
  PageOrientation,
  TableOfContents,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';

// --- Constants & Styles ---
const OQI_BLUE = "#005a9c"; // Example professional blue
const OQI_ACCENT = "#4bc0c0";
const FONT_HEADER = "Arial";
const FONT_BODY = "Calibri";

// --- Vocabulary Banks for Narrative ---
const VOCAB = {
  openers: [
    "Analysis of the responses for",
    "Upon reviewing the feedback regarding",
    "The data collected for",
    "Examining the participant input on",
    "The distribution of answers for"
  ],
  dominance: [
    "reveals a commanding consensus",
    "shows a clear preference",
    "indicates a strong alignment",
    "demonstrates a significant majority",
    "highlights a dominant trend"
  ],
  split: [
    "suggests a divided opinion",
    "indicates competing priorities",
    "reflects a lack of consensus",
    "shows a fragmented distribution",
    "reveals diverse perspectives"
  ],
  minority: [
    "Conversely,",
    "On the other hand,",
    "At the lower end of the spectrum,",
    "Receiving less traction,"
  ]
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- Helper Functions ---

// Fetch OQI Logo
const getLogoImage = async () => {
  try {
    const response = await fetch('/oqi-logo.png');
    if (!response.ok) throw new Error('Logo not found');
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (error) {
    console.warn("Logo fetch failed, proceeding without logo.", error);
    return null;
  }
};

// Advanced Narrative Generator
const generateDiscussionText = (questionTitle, counts, total) => {
  if (total === 0) return "No data available for analysis.";

  const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const topPercentage = parseFloat(((top.count / total) * 100).toFixed(1));
  
  let narrative = `${getRandom(VOCAB.openers)} "${questionTitle}" `;
  
  // Complexity Analysis
  if (topPercentage > 60) {
    narrative += `${getRandom(VOCAB.dominance)}. Specifically, ${topPercentage}% of respondents selected "${top.label}". This suggests that this option is the overwhelming standard or preference within the current ecosystem. `;
  } else if (topPercentage > 40) {
    narrative += `shows that while "${top.label}" is the leading choice (${topPercentage}%), it does not hold an absolute majority. This indicates a general trend but allows room for alternative approaches. `;
  } else {
    narrative += `${getRandom(VOCAB.split)}, with the most frequent choice, "${top.label}", securing only ${topPercentage}% of the total. This fragmentation points to a highly heterogeneous environment. `;
  }

  // Comparative Analysis
  if (sorted.length > 1) {
    const second = sorted[1];
    const secondPercentage = ((second.count / total) * 100).toFixed(1);
    const diff = top.count - second.count;
    
    if (diff === 0) {
       narrative += `Notably, "${second.label}" ties for the top spot, highlighting a distinct polarization or equal weight between these two factors. `;
    } else if ((top.count - second.count) / total < 0.15) {
       narrative += `The distinction between the top choice and the runner-up, "${second.label}" (${secondPercentage}%), is marginal. These two options likely represent the primary competing narratives or methodologies in the field. `;
    } else {
       narrative += `There is a significant drop-off to the second most common response, "${second.label}" at ${secondPercentage}%, reinforcing the primacy of the leading option. `;
    }
  }

  // Minority Analysis
  if (bottom.count === 0 && sorted.length > 2) {
    narrative += `It is also significant that "${bottom.label}" received zero engagement, suggesting it may be obsolete or irrelevant in the current context.`;
  } else if (sorted.length > 2 && (bottom.count / total) < 0.05) {
    narrative += `${getRandom(VOCAB.minority)} "${bottom.label}" appears to be a niche or outlier case, represented by only a negligible fraction of the cohort.`;
  }

  return narrative;
};

// Dynamic Chart Generator
const getChartImage = async (labels, data) => {
  // Determine Chart Type based on data shape
  let type = 'bar';
  let options = {};
  
  const distinctValues = labels.length;
  const maxLabelLength = Math.max(...labels.map(l => l.length));

  if (distinctValues <= 5) {
    type = 'pie'; // Use Pie for few options
  } else if (maxLabelLength > 15) {
    type = 'horizontalBar'; // Horizontal for long labels
  }

  const chartConfig = {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: 'Responses',
        data: data,
        // OQI Color Palette approximation for Pie charts
        backgroundColor: [
          'rgba(0, 90, 156, 0.7)',   // OQI Blue
          'rgba(75, 192, 192, 0.7)', // Teal
          'rgba(255, 205, 86, 0.7)', // Yellow
          'rgba(255, 99, 132, 0.7)', // Red
          'rgba(153, 102, 255, 0.7)', // Purple
          'rgba(201, 203, 207, 0.7)'  // Grey
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      }]
    },
    options: {
      plugins: {
        legend: { 
          display: type === 'pie' || type === 'doughnut', 
          position: 'right' 
        },
        datalabels: { 
          display: true, 
          color: type === 'pie' ? '#fff' : '#000',
          font: { weight: 'bold', size: 14 },
          formatter: (value, ctx) => {
            const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = (value * 100 / sum).toFixed(1) + "%";
            return percentage;
          }
        }
      }
    }
  };

  const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300&bkg=white`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Chart request failed: ${response.statusText}`);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (error) {
    console.error("Error generating chart:", error);
    return null;
  }
};

export const generateWordReport = async (submissions, questions) => {
  if (!submissions || submissions.length === 0) {
    // Alert handled in UI usually, but good here too
    throw new Error('No submissions to export.');
  }

  const validQuestions = (questions || [])
    .filter(q => q && q.title && q.title.trim() !== '')
    .sort((a, b) => (a.step_id || 0) - (b.step_id || 0) || a.title.localeCompare(b.title));

  const totalSubmissions = submissions.length;
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Safely handle logo fetching
  let logoBuffer = null;
  try {
    logoBuffer = await getLogoImage();
  } catch (e) {
    console.warn("Logo fetch skipped", e);
  }

  // --- 1. COVER PAGE ---
  const coverPage = [];
  
  if (logoBuffer) {
    coverPage.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 200, height: 200 },
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 1000 },
      })
    );
  } else {
    // Fallback spacing if no logo
    coverPage.push(
      new Paragraph({
        text: "",
        spacing: { before: 2000, after: 1000 },
      })
    );
  }

  coverPage.push(
    new Paragraph({
      text: "COMPREHENSIVE ANALYSIS REPORT",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      style: "Title",
    }),
    new Paragraph({
      text: "Open Quantum Institute Questionnaire",
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 3000 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Generated Date: ", bold: true }),
        new TextRun(dateStr),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Total Participants: ", bold: true }),
        new TextRun(String(totalSubmissions)),
      ],
      alignment: AlignmentType.CENTER,
      pageBreakBefore: false,
    })
  );

  // --- 2. TABLE OF CONTENTS ---
  const tocPage = [
    new Paragraph({
      text: "Table of Contents",
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      spacing: { after: 400 },
    }),
    new TableOfContents("Summary", {
      hyperlink: true,
      headingStyleRange: "1-2",
    }),
  ];

  // --- 3. EXECUTIVE SUMMARY ---
  const summaryPage = [
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
    }),
    new Paragraph({
      text: "This document presents a detailed evaluation of the data gathered through the OQI stakeholder engagement initiative. The insights derived herein are intended to guide strategic decision-making and identify critical gaps within the current landscape.",
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "Key findings are presented through a combination of statistical tables, visual data representations, and narrative interpretation. This multi-faceted approach ensures that both quantitative metrics and qualitative nuances are captured effectively.",
    }),
  ];

  // --- 4. QUESTION ANALYSIS ---
  const questionSections = [];

  for (const [index, question] of validQuestions.entries()) {
    
    // Header for the question
    questionSections.push(
      new Paragraph({
        text: `${index + 1}. ${question.title}`,
        heading: HeadingLevel.HEADING_2,
        pageBreakBefore: true, // Start each question on new page for cleanliness
        spacing: { after: 300 },
      })
    );

    // Context/Description
    if (question.description) {
      questionSections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Context: ", bold: true, color: "666666" }),
            new TextRun({ text: question.description, italics: true }),
          ],
          spacing: { after: 300 },
          border: { left: { style: BorderStyle.SINGLE, size: 24, color: "CCCCCC", space: 10 } },
          indent: { left: 400 },
        })
      );
    }

    // --- LOGIC FOR STRUCTURED DATA ---
    if (['radio', 'select', 'checkbox'].includes(question.type)) {
      const counts = {};
      const comments = [];
      
      (question.options || []).forEach(opt => {
        counts[opt.value] = { label: opt.label, count: 0 };
      });

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
          if (answerData.comment) comments.push(answerData.comment);
        }
      });

      // 1. Narrative
      questionSections.push(new Paragraph({ text: "Analysis & Discussion", heading: HeadingLevel.HEADING_3 }));
      questionSections.push(new Paragraph({ 
        text: generateDiscussionText(question.title, counts, questionResponseCount),
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400 } 
      }));

      // 2. Visuals (Charts)
      const labels = [];
      const data = [];
      Object.values(counts).forEach(item => {
        let label = item.label || "Unknown";
        // Truncate for charts but keep full for table
        if (label.length > 40) label = label.substring(0, 40) + '...';
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
                transformation: { width: 500, height: 300 },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );
      }

      // 3. Data Table
      questionSections.push(new Paragraph({ text: "Data Breakdown", heading: HeadingLevel.HEADING_3 }));
      
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Option", bold: true, color: "FFFFFF" })], shading: { fill: OQI_BLUE }, width: { size: 60, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: "Count", bold: true, color: "FFFFFF" })], shading: { fill: OQI_BLUE }, width: { size: 20, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: "%", bold: true, color: "FFFFFF" })], shading: { fill: OQI_BLUE }, width: { size: 20, type: WidthType.PERCENTAGE } }),
          ],
          tableHeader: true,
        }),
      ];

      Object.values(counts).forEach((item, idx) => {
        const percentage = questionResponseCount > 0 ? ((item.count / questionResponseCount) * 100).toFixed(1) + '%' : '0.0%';
        const fillColor = idx % 2 === 0 ? "F9F9F9" : "FFFFFF"; // Striped rows
        
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(item.label || "Unknown")], shading: { fill: fillColor } }),
              new TableCell({ children: [new Paragraph(String(item.count))], shading: { fill: fillColor } }),
              new TableCell({ children: [new Paragraph(percentage)], shading: { fill: fillColor } }),
            ],
          })
        );
      });

      questionSections.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: OQI_BLUE },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: OQI_BLUE },
          }
        })
      );
      questionSections.push(new Paragraph({ text: "", spacing: { after: 300 } }));

      // 4. Comments
      if (comments.length > 0) {
        questionSections.push(new Paragraph({ text: "Respondent Commentary", heading: HeadingLevel.HEADING_3 }));
        comments.forEach(comment => {
          questionSections.push(
            new Paragraph({
              children: [
                 new TextRun({ text: "• ", bold: true, color: OQI_BLUE }),
                 new TextRun({ text: comment }),
              ],
              spacing: { after: 100 },
            })
          );
        });
      }

    } else {
      // --- LOGIC FOR TEXT DATA ---
      questionSections.push(new Paragraph({ text: "Qualitative Input", heading: HeadingLevel.HEADING_3 }));
      const textAnswers = submissions
        .map(s => s.answers[question.id]?.answer)
        .filter(a => a);
        
      if (textAnswers.length > 0) {
        questionSections.push(
          new Paragraph({
            text: `The following is a curated selection of the ${textAnswers.length} narrative responses received.`,
            spacing: { after: 200 },
          })
        );
        textAnswers.slice(0, 10).forEach(ans => {
             questionSections.push(
            new Paragraph({
              children: [
                 new TextRun({ text: "➤ ", bold: true, color: OQI_ACCENT }),
                 new TextRun({ text: ans }),
              ],
              spacing: { after: 120 },
            })
          );
        });
      } else {
        questionSections.push(new Paragraph({ text: "No text responses recorded.", italics: true }));
      }
    }
  }

  // --- DOCUMENT ASSEMBLY ---
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            font: FONT_BODY,
            size: 24, // 12pt
          },
        },
        {
          id: "Title",
          name: "Title",
          run: {
            font: FONT_HEADER,
            size: 64, // 32pt
            bold: true,
            color: OQI_BLUE,
          },
          paragraph: {
            spacing: { after: 400 },
            alignment: AlignmentType.CENTER,
          },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          run: {
            font: FONT_HEADER,
            size: 52, // 26pt
            bold: true,
            color: OQI_BLUE,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          run: {
            font: FONT_HEADER,
            size: 36, // 18pt
            bold: true,
            color: "333333",
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          run: {
            font: FONT_HEADER,
            size: 28, // 14pt
            bold: true,
            color: OQI_BLUE,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        {
          id: "IntenseQuote",
          name: "Intense Quote",
          run: {
            italics: true,
            color: "666666"
          },
          paragraph: {
            indent: { left: 400 },
            border: {
              left: {
                color: "CCCCCC",
                space: 10,
                value: "single",
                size: 6,
              },
            },
          },
        }
      ],
    },
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "OQI Confidential - Internal Analysis", size: 16, color: "999999" })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Page ", bold: true }),
                  new PageNumber(),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          ...coverPage,
          ...tocPage,
          ...summaryPage,
          ...questionSections,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `OQI_Comprehensive_Analysis_${new Date().toISOString().split('T')[0]}.docx`);
};