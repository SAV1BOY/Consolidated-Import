import PDFDocument from 'pdfkit';
import { prisma } from '../db.js';
import { calculateKPIs, calculateABC, identifyRiskItems } from './metrics-calculator.js';
import { getLineItemInputs } from './line-item-loader.js';

function fmtBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtUSD(value: number): string {
  return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNum(value: number, decimals = 0): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  startX: number,
) {
  const rowHeight = 18;
  const fontSize = 7;
  const headerFontSize = 7;

  // Header
  let x = startX;
  doc.fontSize(headerFontSize).font('Helvetica-Bold');
  doc.rect(startX, doc.y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#333333');
  const headerY = doc.y + 5;
  headers.forEach((h, i) => {
    doc.fillColor('#FFFFFF').text(h, x + 2, headerY, { width: colWidths[i] - 4, height: rowHeight, lineBreak: false });
    x += colWidths[i];
  });
  doc.y = headerY + rowHeight - 5;

  // Rows
  doc.font('Helvetica').fontSize(fontSize).fillColor('#000000');
  for (const row of rows) {
    if (doc.y > 750) {
      doc.addPage();
      doc.y = 40;
    }
    x = startX;
    const rowY = doc.y + 3;
    row.forEach((cell, i) => {
      doc.text(cell, x + 2, rowY, { width: colWidths[i] - 4, height: rowHeight, lineBreak: false });
      x += colWidths[i];
    });
    doc.y = rowY + rowHeight - 3;
  }
}

export async function generatePDF(consolidationId: number): Promise<Buffer> {
  const consolidation = await prisma.consolidation.findUnique({
    where: { id: consolidationId },
  });

  if (!consolidation) throw new Error('Consolidation not found');

  const inputs = await getLineItemInputs(consolidationId);
  const kpis = calculateKPIs(inputs, consolidation.exchangeRate);
  const abcItems = calculateABC(inputs);
  const risks = identifyRiskItems(inputs);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Uint8Array[] = [];

    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#118AB2')
      .text('ILUMINAR', 40, 40);
    doc.fontSize(14).fillColor('#333333')
      .text(`Consolidação — ${consolidation.meetingNumber}ª Reunião`, 40, 65);
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    const meta = [
      `Data: ${fmtDate(consolidation.meetingDate)}`,
      `Câmbio: ${fmtNum(Number(consolidation.exchangeRate), 4)}`,
      `Status: ${consolidation.status}`,
    ];
    if (consolidation.description) meta.splice(1, 0, consolidation.description);
    doc.text(meta.join('  |  '), 40, 85);
    doc.moveDown(1.5);

    // Separator
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#CCCCCC').stroke();
    doc.moveDown(0.5);

    // KPIs Grid (2 columns x 5 rows)
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333').text('Indicadores', 40, doc.y);
    doc.moveDown(0.5);

    const kpiPairs = [
      ['Total de Itens', fmtNum(kpis.totalItems)],
      ['Itens com Compra', fmtNum(kpis.itemsWithPurchase)],
      ['Fornecedores', `${kpis.activeSuppliers} ativos / ${kpis.totalSuppliers} total`],
      ['Quantidade Total', fmtNum(kpis.totalQuantity)],
      ['Total FOB USD', fmtUSD(kpis.totalFobUsd)],
      ['Total FOB BRL', fmtBRL(kpis.totalFobBrl)],
      ['Total Nacionalizado', fmtBRL(kpis.totalNationalized)],
      ['Custo Médio/Un.', fmtBRL(kpis.avgCostPerUnit)],
    ];

    const kpiStartY = doc.y;
    doc.fontSize(8).font('Helvetica');
    kpiPairs.forEach((pair, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 40 + col * 260;
      const y = kpiStartY + row * 28;
      doc.fillColor('#999999').text(pair[0], x, y);
      doc.font('Helvetica-Bold').fillColor('#333333').text(pair[1], x, y + 11);
      doc.font('Helvetica');
    });

    doc.y = kpiStartY + Math.ceil(kpiPairs.length / 2) * 28 + 10;

    // Separator
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#CCCCCC').stroke();
    doc.moveDown(0.5);

    // Items table
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333').text('Itens', 40, doc.y);
    doc.moveDown(0.5);

    const itemHeaders = ['Código', 'Descrição', 'Fornecedor', 'Qtd', 'FOB USD', 'Nacionalizado', 'ABC'];
    const itemColWidths = [50, 150, 100, 40, 60, 70, 45];

    const itemRows = abcItems.map(item => [
      String(item.code),
      item.description.substring(0, 35),
      item.supplier.substring(0, 20),
      fmtNum(item.quantity),
      fmtUSD(item.nationalizedValue > 0 ? item.nationalizedValue / 2 : 0),
      fmtBRL(item.nationalizedValue),
      item.abcClass,
    ]);

    drawTable(doc, itemHeaders, itemRows, itemColWidths, 40);

    // Risk section
    if (risks.length > 0) {
      doc.moveDown(1);
      if (doc.y > 700) doc.addPage();

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#EF476F').text('Itens em Risco', 40, doc.y);
      doc.moveDown(0.5);

      const riskHeaders = ['Código', 'Descrição', 'Fornecedor', 'Estoque', 'Méd. Mensal', 'Dur. (meses)', 'Qtd Sug.'];
      const riskColWidths = [50, 150, 100, 55, 55, 55, 50];

      const riskRows = risks.map(r => [
        String(r.code),
        r.description.substring(0, 35),
        r.supplier.substring(0, 20),
        fmtNum(r.stockAvailable),
        fmtNum(r.monthlyAvg),
        fmtNum(r.stockDuration, 1),
        fmtNum(r.suggestedQty),
      ]);

      drawTable(doc, riskHeaders, riskRows, riskColWidths, 40);
    }

    // Footer
    const now = new Date();
    doc.fontSize(7).font('Helvetica').fillColor('#999999');
    doc.text(
      `Gerado em ${fmtDate(now)} às ${now.toLocaleTimeString('pt-BR')} — ILUMINAR`,
      40, 780, { align: 'center', width: 515 },
    );

    doc.end();
  });
}
