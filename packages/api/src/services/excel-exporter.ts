import ExcelJS from 'exceljs';
import { prisma } from '../db.js';
import { calculateKPIs, calculateABC, identifyRiskItems } from './metrics-calculator.js';
import { getLineItemInputs } from './line-item-loader.js';
import type { DashboardKPIs, ABCItem, RiskItem } from '../types.js';

const ABC_COLORS: Record<string, string> = {
  A: 'FF06D6A0',
  B: 'FFFFD166',
  C: 'FFEF476F',
};

function currencyFmt(decimals = 2): string {
  return `#,##0.${'0'.repeat(decimals)}`;
}

function addResumoSheet(
  wb: ExcelJS.Workbook,
  consolidation: { meetingNumber: number; meetingDate: Date; description: string | null; exchangeRate: number; status: string },
  kpis: DashboardKPIs,
) {
  const ws = wb.addWorksheet('Resumo');
  ws.columns = [{ width: 30 }, { width: 30 }];

  ws.addRow(['ILUMINAR — Consolidação']).font = { bold: true, size: 16 };
  ws.addRow([]);
  ws.addRow(['Reunião', `${consolidation.meetingNumber}ª`]);
  ws.addRow(['Data', consolidation.meetingDate]);
  ws.getCell('B4').numFmt = 'dd/mm/yyyy';
  if (consolidation.description) ws.addRow(['Descrição', consolidation.description]);
  ws.addRow(['Câmbio (USD→BRL)', consolidation.exchangeRate]);
  ws.addRow(['Status', consolidation.status]);
  ws.addRow([]);

  ws.addRow(['KPIs']).font = { bold: true, size: 14 };
  ws.addRow(['Total de Itens', kpis.totalItems]);
  ws.addRow(['Itens com Compra', kpis.itemsWithPurchase]);
  ws.addRow(['Fornecedores Totais', kpis.totalSuppliers]);
  ws.addRow(['Fornecedores Ativos', kpis.activeSuppliers]);

  const fobUsdRow = ws.addRow(['Total FOB USD', kpis.totalFobUsd]);
  fobUsdRow.getCell(2).numFmt = currencyFmt();

  const fobBrlRow = ws.addRow(['Total FOB BRL', kpis.totalFobBrl]);
  fobBrlRow.getCell(2).numFmt = currencyFmt();

  const natRow = ws.addRow(['Total Nacionalizado', kpis.totalNationalized]);
  natRow.getCell(2).numFmt = currencyFmt();

  const avgRow = ws.addRow(['Custo Médio/Unidade', kpis.avgCostPerUnit]);
  avgRow.getCell(2).numFmt = currencyFmt();

  ws.addRow(['Quantidade Total', kpis.totalQuantity]);
}

function addItensSheet(
  wb: ExcelJS.Workbook,
  items: ABCItem[],
  allInputs: Array<{ code: number; costFobUsd: number; totalFobUsd: number; totalFobBrl: number; stockAvailable: number; monthlyAvg: number; stockDuration: number; suggestedQty: number; nationalizedValue: number }>,
) {
  const ws = wb.addWorksheet('Itens');

  const headers = [
    'Código', 'Descrição', 'Fornecedor', 'Custo FOB USD', 'Qtd Sugerida',
    'Qtd Decidida', 'Total FOB USD', 'Total FOB BRL', 'Nacionalizado',
    'Estoque', 'Média Mensal', 'Dur. Estoque', 'Classe ABC',
  ];

  const headerRow = ws.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
  });

  // Build lookup from ABC data
  const abcMap = new Map(items.map(i => [i.code, i]));
  const inputMap = new Map(allInputs.map(i => [i.code, i]));

  for (const abc of items) {
    const input = inputMap.get(abc.code);
    if (!input) continue;

    const row = ws.addRow([
      abc.code,
      abc.description,
      abc.supplier,
      input.costFobUsd,
      input.suggestedQty,
      abc.quantity,
      input.totalFobUsd,
      input.totalFobBrl,
      input.nationalizedValue,
      input.stockAvailable,
      input.monthlyAvg,
      input.stockDuration,
      abc.abcClass,
    ]);

    // Currency formatting
    [4, 7, 8, 9].forEach(col => { row.getCell(col).numFmt = currencyFmt(); });

    // ABC color band
    const color = ABC_COLORS[abc.abcClass];
    if (color) {
      row.getCell(13).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    }
  }

  ws.columns.forEach((col, i) => {
    col.width = i === 1 ? 40 : i === 2 ? 25 : 15;
  });
}

function addParetoSheet(wb: ExcelJS.Workbook, abcItems: ABCItem[]) {
  const ws = wb.addWorksheet('Pareto ABC');

  const headerRow = ws.addRow([
    'Código', 'Descrição', 'Fornecedor', 'Valor Nacionalizado', '% Individual', '% Acumulada', 'Classe',
  ]);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
  });

  for (const item of abcItems) {
    const row = ws.addRow([
      item.code,
      item.description,
      item.supplier,
      item.nationalizedValue,
      item.percentage / 100,
      item.cumulativePercentage / 100,
      item.abcClass,
    ]);

    row.getCell(4).numFmt = currencyFmt();
    row.getCell(5).numFmt = '0.00%';
    row.getCell(6).numFmt = '0.00%';

    const color = ABC_COLORS[item.abcClass];
    if (color) {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    }
  }

  ws.columns.forEach((col, i) => {
    col.width = i === 1 ? 40 : i === 2 ? 25 : 18;
  });
}

function addRiscosSheet(wb: ExcelJS.Workbook, risks: RiskItem[]) {
  const ws = wb.addWorksheet('Riscos');

  const headerRow = ws.addRow([
    'Código', 'Descrição', 'Fornecedor', 'Estoque Disponível', 'Média Mensal', 'Dur. Estoque (meses)', 'Qtd Sugerida',
  ]);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF476F' } };
  });

  for (const item of risks) {
    ws.addRow([
      item.code,
      item.description,
      item.supplier,
      item.stockAvailable,
      item.monthlyAvg,
      item.stockDuration,
      item.suggestedQty,
    ]);
  }

  ws.columns.forEach((col, i) => {
    col.width = i === 1 ? 40 : i === 2 ? 25 : 18;
  });
}

export async function generateExcel(consolidationId: number): Promise<Buffer> {
  const consolidation = await prisma.consolidation.findUnique({
    where: { id: consolidationId },
  });

  if (!consolidation) throw new Error('Consolidation not found');

  const inputs = await getLineItemInputs(consolidationId);
  const kpis = calculateKPIs(inputs, consolidation.exchangeRate);
  const abcItems = calculateABC(inputs);
  const risks = identifyRiskItems(inputs);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'ILUMINAR';
  wb.created = new Date();

  addResumoSheet(wb, consolidation, kpis);
  addItensSheet(wb, abcItems, inputs);
  addParetoSheet(wb, abcItems);
  addRiscosSheet(wb, risks);

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
