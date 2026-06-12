import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DEBUG_PDF = false;

function logDebug(msg) {
  if (DEBUG_PDF) console.log(msg);
}

function safeText(value, fallback = "N/A") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function safeArray(value) {
  if (Array.isArray(value)) return value;
  return [];
}

function safeJoin(array, separator = ", ") {
  return safeArray(array).map(item => safeText(item, "")).filter(Boolean).join(separator);
}

function formatBreachSource(source) {
  if (!source) return { name: 'Unknown', date: 'Unknown' };
  if (typeof source === 'string') return { name: source, date: 'Unknown' };
  
  const name = source.name || source.source || source.breach || source.domain || 'Unknown';
  const date = source.date || source.breachDate || 'Unknown';
  return { name: safeText(name), date: safeText(date) };
}

function getRiskLevelBadge(score) {
  const s = Number(score) || 0;
  if (s >= 80) return { label: 'Critical Risk', color: [220, 38, 38] }
  if (s >= 60) return { label: 'High Risk', color: [234, 88, 12] }
  if (s >= 30) return { label: 'Moderate Risk', color: [202, 138, 4] }
  return { label: 'Low Risk', color: [22, 163, 74] }
}

const LOGO_BASE64 = "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";

export function generatePDFReport(data) {
  logDebug("PDF: start");
  
  if (!data) {
    throw new Error("No data provided to PDF generator.");
  }

  const doc = new jsPDF('p', 'pt', 'a4');
  let yPos = 40;
  const leftMargin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();

  const addHeading = (text, size = 14, spaceAfter = 15) => {
    const textStr = safeText(text, "");
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(textStr, leftMargin, yPos);
    yPos += spaceAfter;
  }

  const addTextLine = (text, size = 11, bold = false, color = [51, 65, 85]) => {
    const textStr = safeText(text, "");
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(textStr, pageWidth - leftMargin * 2);
    doc.text(lines, leftMargin, yPos);
    yPos += (lines.length * size * 1.2) + 5;
  }

  const checkPageBreak = (spaceNeeded = 40) => {
    if (yPos + spaceNeeded > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      yPos = 40;
    }
  }

  const modeStr = safeText(data.mode, "unknown");
  const scopeStr = modeStr === 'full' ? 'Full Scan' : modeStr === 'email' ? 'Email Exposure Scan' : modeStr === 'username' ? 'Username Exposure Scan' : 'Exposure Scan';
  const dateStr = new Date().toLocaleString();

  // --- HEADER (with Logo) ---
  // Add logo base64. Adjust dimensions (w=32, h=32)
  doc.addImage(LOGO_BASE64, 'PNG', leftMargin, yPos, 28, 28);
  
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('PersonaWatch', leftMargin + 38, yPos + 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Digital Exposure Intelligence Platform', leftMargin + 38, yPos + 36);
  yPos += 60;

  doc.setDrawColor(226, 232, 240);
  doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
  yPos += 30;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Exposure Report', leftMargin, yPos);
  yPos += 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${dateStr}`, leftMargin, yPos);
  yPos += 15;
  doc.text(`Scan Scope: ${scopeStr}`, leftMargin, yPos);
  yPos += 25;

  logDebug("PDF: header done");

  // --- SUMMARY ---
  const digitalScore = data.summary?.digitalExposureScore || 0;
  const risk = getRiskLevelBadge(digitalScore);

  let summaryData = [
    ['Overall Digital Exposure Score', `${digitalScore}/100`],
    ['Risk Classification', risk.label]
  ];

  if (modeStr !== 'username') {
    summaryData.push(['Email Exposure Score', `${data.summary?.emailExposureScore || 0}/100`]);
  }
  if (modeStr !== 'email') {
    summaryData.push(['Username Exposure Score', `${data.summary?.usernameExposureScore || 0}/100`]);
  }

  autoTable(doc, {
    startY: yPos,
    margin: { left: leftMargin },
    head: [['Summary Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 11, cellPadding: 8 },
    columnStyles: { 0: { cellWidth: 200, fontStyle: 'bold', textColor: [51, 65, 85] } },
    didParseCell: function (hookData) {
      if (hookData.section === 'body' && hookData.column.index === 1 && hookData.row.index === 1) {
        hookData.cell.styles.textColor = risk.color;
        hookData.cell.styles.fontStyle = 'bold';
      }
    }
  });

  yPos = doc.lastAutoTable.finalY + 30;
  logDebug("PDF: summary done");

  // --- EMAIL EXPOSURE ---
  if (modeStr !== 'username' && data.emailExposure) {
    logDebug("PDF: email section start");
    checkPageBreak(100);
    doc.setDrawColor(226, 232, 240);
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 25;
    
    addHeading('Email Exposure Details');
    
    const count = data.emailExposure.breachCount || 0;
    addTextLine(`Breach Participation: Found in ${count} breaches.`, 11, true);
    
    const exposedFieldsArray = safeArray(data.emailExposure.exposedFields);
    if (exposedFieldsArray.length > 0) {
      yPos += 5;
      addTextLine(`Exposed Categories: ${safeJoin(exposedFieldsArray, ', ')}`, 10, false, [100, 116, 139]);
    }

    const sourcesArray = safeArray(data.emailExposure.sources);
    if (sourcesArray.length > 0) {
      yPos += 10;
      
      const tableData = sourcesArray.map(s => {
        const formatted = formatBreachSource(s);
        return [formatted.name, formatted.date];
      });

      autoTable(doc, {
        startY: yPos,
        margin: { left: leftMargin },
        head: [['Breach Source', 'Date']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: { 0: { cellWidth: 350 } }
      });
      yPos = doc.lastAutoTable.finalY + 30;
    } else {
      yPos += 15;
    }
    logDebug("PDF: email section done");
  }

  // --- USERNAME EXPOSURE ---
  if (modeStr !== 'email' && data.originalUsernameAnalysis) {
    logDebug("PDF: username section start");
    checkPageBreak(120);
    doc.setDrawColor(226, 232, 240);
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 25;

    addHeading('Username Exposure Details');
    
    let usernameData = [
      ['Verified Matches', `${data.summary?.verifiedMatchCount || 0}`],
      ['Public Signals', `${data.summary?.publicSignalMatchCount || 0}`]
    ];

    const analysis = data.originalUsernameAnalysis;
    const platforms = safeArray(analysis.platforms);
    const matchedPlatforms = platforms
      .filter((p) => p && typeof p === 'object' && p.found === true && !p.error)
      .map((p) => {
        const pName = safeText(p.name, "Unknown");
        if (p.signalType === 'public_signal' || p.signalType === 'restricted_public_signal') return `${pName} (public)`;
        return `${pName} (verified)`;
      });
    
    usernameData.push(['Original Username Matches', matchedPlatforms.length > 0 ? safeJoin(matchedPlatforms, ', ') : 'None']);
    usernameData.push(['Close Variant Matches', `${data.summary?.highRiskCount || 0}`]);
    usernameData.push(['Partial Variant Matches', `${data.summary?.mediumRiskCount || 0}`]);
    usernameData.push(['Weak Variant Matches', `${data.summary?.lowRiskCount || 0}`]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: leftMargin },
      body: usernameData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 6 },
      columnStyles: { 0: { cellWidth: 150, fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [51, 65, 85] } }
    });
    yPos = doc.lastAutoTable.finalY + 30;
    logDebug("PDF: username section done");
  }

  // --- RECOMMENDATIONS ---
  const recsArray = safeArray(data.recommendations);
  if (recsArray.length > 0) {
    checkPageBreak(100);
    doc.setDrawColor(226, 232, 240);
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 25;

    addHeading('Recommendations');

    const recTableData = recsArray.map(rec => {
      if (!rec || typeof rec !== 'object') return null;
      const severityStr = safeText(rec.severity, "low").toUpperCase();
      const title = safeText(rec.title, "Recommendation");
      const desc = safeText(rec.description, "");
      return [severityStr, title, desc];
    }).filter(Boolean);

    if (recTableData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        margin: { left: leftMargin },
        head: [['Priority', 'Recommendation', 'Details']],
        body: recTableData,
        theme: 'grid',
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        styles: { fontSize: 10, cellPadding: 8 },
        columnStyles: { 
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 150, fontStyle: 'bold', textColor: [15, 23, 42] }
        },
        didParseCell: function (hookData) {
          if (hookData.section === 'body' && hookData.column.index === 0) {
            const val = hookData.cell.raw;
            if (val === 'CRITICAL') hookData.cell.styles.textColor = [220, 38, 38];
            if (val === 'HIGH') hookData.cell.styles.textColor = [234, 88, 12];
            if (val === 'MEDIUM') hookData.cell.styles.textColor = [202, 138, 4];
            if (val === 'LOW') hookData.cell.styles.textColor = [22, 163, 74];
          }
        }
      });
      yPos = doc.lastAutoTable.finalY + 30;
    }
    logDebug("PDF: recommendations done");
  }

  // --- METHODOLOGY ---
  checkPageBreak(80);
  doc.setDrawColor(226, 232, 240);
  doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
  yPos += 25;

  addHeading('Methodology', 12, 10);
  let formula = '';
  if (modeStr === 'full') {
    formula = 'Digital Exposure Score = 0.55 × Email Exposure Score + 0.45 × Username Exposure Score';
  } else if (modeStr === 'email') {
    formula = 'Overall Exposure = Email Exposure Score';
  } else {
    formula = 'Overall Exposure = Username Exposure Score';
  }
  addTextLine(formula, 10, true);
  addTextLine('Provider weights distinguish verified API matches from public visibility signals.', 10, false, [100, 116, 139]);
  yPos += 15;

  // --- ADD PAGINATION & FOOTER ---
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(leftMargin, doc.internal.pageSize.getHeight() - 40, pageWidth - leftMargin, doc.internal.pageSize.getHeight() - 40);
    
    // Page number (right)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - leftMargin - 50, doc.internal.pageSize.getHeight() - 25);
    
    // Disclaimer / Note (left)
    doc.text('Generated by PersonaWatch · Academic Research Prototype', leftMargin, doc.internal.pageSize.getHeight() - 25);
  }

  doc.save('PersonaWatch-Exposure-Report.pdf');
  logDebug("PDF: save called");
}
