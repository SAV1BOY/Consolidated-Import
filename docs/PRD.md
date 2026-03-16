# PRD — Sistema de Gestao de Importacao ILUMINAR

**Versao**: 1.0
**Data**: 2026-03-16
**Status**: Draft

---

## 1. Visao Geral

Sistema web para gestao de importacoes da ILUMINAR, substituindo planilhas estaticas por uma plataforma com upload de dados, edicao colaborativa, historico de reunioes e dashboards interativos.

## 2. Problema

- Dados de importacao em planilhas Excel sem versionamento
- 26 reunioes/ano com decisoes de compra sem rastreabilidade
- Quantidades alteradas pos-reuniao sem audit trail
- Novos itens/codigos adicionados manualmente
- Dashboards desconectados dos dados reais
- Impossibilidade de comparar decisoes entre reunioes

## 3. Objetivos

1. **Upload de Planilhas**: Importar `.xlsx` com mapeamento configuravel de colunas, auto-detectar novos codigos
2. **Edicao de Quantidades**: Edicao inline pos-reuniao com audit trail
3. **Historico Completo**: Cada consolidado versionado (Reuniao 1/26, 2/26...)
4. **Dashboards Dinamicos**: KPIs, Pareto ABC, concentracao de fornecedores, analise de risco
5. **Rastreabilidade**: Log de todas as alteracoes (quem, quando, o que mudou)

## 4. Personas

| Persona | Necessidade |
|---------|------------|
| Comprador / Analista de Importacao | Upload de planilhas, edicao de quantidades, visualizacao de itens |
| Gestor de Supply Chain | Dashboards, comparacao entre reunioes, analise de risco |
| Diretor | Visao executiva dos consolidados, KPIs de alto nivel |

## 5. Funcionalidades

### P0 — Essencial (MVP)

| # | Feature | Descricao |
|---|---------|-----------|
| F1 | Upload XLSX | Upload de planilha com mapeamento configuravel de colunas |
| F2 | Auto-merge | Novos codigos detectados e adicionados automaticamente |
| F3 | Edicao inline | Alterar quantidade decidida pos-reuniao |
| F4 | Historico | Lista de todos os consolidados por reuniao |
| F5 | Dashboard | KPIs: total itens, FOB USD/BRL, nacionalizado, cambio |

### P1 — Importante

| # | Feature | Descricao |
|---|---------|-----------|
| F6 | Pareto ABC | Classificacao ABC de itens e fornecedores por valor |
| F7 | Risco | Itens com cobertura de estoque < 3 meses |
| F8 | Comparacao | Diff lado a lado entre 2 reunioes |
| F9 | Audit trail | Log completo de alteracoes com valores antigo/novo |

### P2 — Futuro

| # | Feature | Descricao |
|---|---------|-----------|
| F10 | Exportacao | Gerar PDF/Excel dos consolidados |
| F11 | Autenticacao | Login com perfis (Analista, Gestor, Diretor) |

## 6. Arquitetura

### Stack

| Camada | Tecnologia | Deploy |
|--------|-----------|--------|
| Frontend | Next.js 14 + TypeScript + Recharts + Tailwind | Vercel |
| Backend | Node.js + Express + TypeScript | Railway/Render |
| Database | PostgreSQL | Railway/Render managed |
| ORM | Prisma | — |
| Excel | ExcelJS | — |
| Testes | Vitest + Playwright | CI/CD |

### Modelo de Dados

- **Supplier**: id, code, name
- **Item**: id, code, description, supplierId, costFobUsd
- **Consolidation**: id, meetingNumber, totalMeetings, meetingDate, description, exchangeRate, status, columnMapping
- **ConsolidationLineItem**: consolidationId, itemId, stockPhysical, stockAvailable, monthlyAvg, stockDuration, suggestedQty, decidedQty, totalFobUsd, totalFobBrl, totalNationalized, abcClass
- **AuditLog**: consolidationId, action, entityType, entityId, oldValue, newValue
- **ColumnMapping**: name, mapping (JSON), isDefault

### API Endpoints

```
POST   /api/consolidations                      # Criar
GET    /api/consolidations                      # Listar
GET    /api/consolidations/:id                  # Detalhe
PATCH  /api/consolidations/:id                  # Atualizar status
POST   /api/consolidations/:id/upload           # Upload XLSX
POST   /api/upload/preview                      # Preview colunas
PATCH  /api/consolidations/:id/items/:itemId    # Editar qty
GET    /api/dashboard/:consolidationId           # KPIs
GET    /api/dashboard/:consolidationId/pareto    # ABC
GET    /api/dashboard/:consolidationId/risk      # Risco
GET    /api/consolidations/:id/compare/:otherId  # Comparar
GET    /api/items                                # Catalogo
GET    /api/suppliers                            # Fornecedores
GET    /api/audit-log                            # Historico
```

## 7. Mapeamento Configuravel de Colunas

O formato das planilhas XLSX pode variar. O sistema oferece:

1. **Preview**: Mostra primeiras 5 linhas ao fazer upload
2. **Mapeamento**: UI para associar colunas da planilha aos campos do sistema
3. **Templates**: Salvar mapeamentos reutilizaveis
4. **Auto-deteccao**: Detectar colunas por nome de cabecalho (fuzzy match)

**Campos obrigatorios**: code, description, supplier, costFobUsd, suggestedQty
**Campos opcionais**: stockPhysical, stockAvailable, monthlyAvg, stockDuration, totalFobUsd, totalFobBrl, totalNationalized

## 8. Metricas de Referencia

Valores do consolidado atual para validacao:

| Metrica | Valor |
|---------|-------|
| Total itens na base | 101 |
| Itens com sugestao de compra | 14 |
| Fornecedores ativos | 8 (de 16 total) |
| Quantidade total | 6.715 unidades |
| Valor FOB USD | $13,183.20 |
| Valor FOB BRL | R$ 70,176.81 |
| Valor nacionalizado | R$ 140,353.62 |
| Custo medio/unidade | R$ 20.90 |
| Cambio referencia | US$ 1 = R$ 5.3232 |

## 9. Sistemas de Referencia

- **ERPNext** — ERP open-source com modulo de compras
- **Odoo** — Purchase module com workflow
- **InvenTree** — Gestao de inventario (Django + React)
- **Apache Superset** — Dashboards analiticos
- **Metabase** — BI self-service

## 10. Sprints

| Sprint | Duracao | Entregaveis |
|--------|---------|------------|
| 0 | 1 sem | Setup, schema, Docker, CI, TDD |
| 1 | 2 sem | Upload XLSX + column mapper + merge |
| 2 | 2 sem | Tabela editavel + audit log |
| 3 | 2 sem | Dashboard KPIs + graficos |
| 4 | 2 sem | Historico + comparacao |
| 5 | 1 sem | Deploy + polimento |
