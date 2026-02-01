# Gestao Porto Rio - Projeto Airbnb

Projeto de gestao profissional de aluguel de temporada no Rio de Janeiro.

## Visao Geral

Landing page e sistema de captacao de leads para servico de gestao profissional de Airbnb, focado nas regioes do Centro, Porto Maravilha, Lapa e Santa Teresa do Rio de Janeiro.

## Estrutura do Projeto (v2.0)

```
SaAirbnb/
├── assets/                         # Recursos estaticos (NOVO)
│   ├── css/
│   │   └── styles.css             # Estilos principais (separado)
│   ├── js/
│   │   ├── config.js              # Configuracoes centralizadas
│   │   ├── calculator.js          # Modulo da calculadora
│   │   ├── form.js                # Modulo do formulario
│   │   └── main.js                # Aplicacao principal
│   ├── data/
│   │   ├── calculator-data.json   # Dados da calculadora (dinamico)
│   │   └── config.json            # Configuracoes do site
│   └── images/                    # Imagens e assets visuais
│
├── docs/                          # Documentacao estrategica
│   ├── planejamento/
│   │   ├── PRD_Gestao_Airbnb.md   # Product Requirements Document
│   │   └── Checklist_Lancamento.md # Checklist operacional 30 dias
│   ├── comercial/
│   │   └── Proposta_Comercial.md  # Proposta para proprietarios
│   └── mercado/
│       └── Validacao_Mercado_2026.md # Dados validados 2025/2026
│
├── site/                          # Versao anterior (legado)
│   ├── index.html
│   └── _archive/
│
├── propostas/                     # Propostas individuais (PDFs)
│
├── index.html                     # Landing page v1 (legado)
├── index-v2.html                  # Landing page v2 (NOVO - usar este)
└── README.md
```

## Inicio Rapido

### 1. Configuracao Inicial

Antes de fazer deploy, atualize as configuracoes:

```javascript
// assets/js/config.js
const SiteConfig = {
    contact: {
        whatsapp: {
            number: '5521999999999', // ALTERAR para numero real
            display: '(21) 99999-9999'
        },
        email: 'contato@gestaoportorio.com.br'
    },
    analytics: {
        googleAnalyticsId: 'G-XXXXXXXXXX', // Adicionar GA4 ID
        facebookPixelId: 'XXXXXXXXXX',     // Adicionar FB Pixel
        enabled: true // Ativar quando estiver pronto
    }
};
```

### 2. Atualizando Dados da Calculadora

Os dados da calculadora estao em `assets/data/calculator-data.json`:

```json
{
  "types": {
    "studio": { "baseRate": 280, "occupancy": 0.50 },
    "1q": { "baseRate": 350, "occupancy": 0.50 }
  },
  "regions": {
    "centro": { "multiplier": 1.0 },
    "copacabana": { "multiplier": 1.3 }
  }
}
```

### 3. Deploy

Para ambiente de producao:

1. Renomeie `index-v2.html` para `index.html`
2. Atualize as configuracoes de contato
3. Ative analytics
4. Faca upload para seu servidor/hosting

## Arquitetura v2.0

### Melhorias Implementadas

| Feature | v1 | v2 |
|---------|----|----|
| CSS | Inline (1446 linhas) | Arquivo externo |
| JavaScript | Inline (130 linhas) | Modular (4 arquivos) |
| Calculadora | Dados hardcoded | JSON configuravel |
| Formulario | Apenas WhatsApp | Validacao robusta + WhatsApp |
| SEO | Meta tags basicas | Schema.org/JSON-LD |
| Acessibilidade | Parcial | ARIA completo |
| Analytics | Nenhum | GA4 + FB Pixel ready |

### Modulos JavaScript

| Arquivo | Responsabilidade |
|---------|------------------|
| `config.js` | Configuracoes centralizadas |
| `calculator.js` | Logica da calculadora de receita |
| `form.js` | Validacao e envio do formulario |
| `main.js` | Menu mobile, FAQ, scroll, analytics |

### Validacao de Formulario

O sistema valida:
- **Nome:** Minimo 3 caracteres
- **WhatsApp:** Formato (21) 99999-9999
- **Email:** Formato valido (opcional)
- **Endereco:** Minimo 10 caracteres

## Documentos Principais

| Documento | Descricao | Localizacao |
|-----------|-----------|-------------|
| PRD | Visao do produto, estrategia, modelo | `docs/planejamento/PRD_Gestao_Airbnb.md` |
| Checklist | Plano de 30 dias para lancamento | `docs/planejamento/Checklist_Lancamento.md` |
| Proposta | Material de venda para proprietarios | `docs/comercial/Proposta_Comercial.md` |
| Validacao | Dados de mercado com fontes | `docs/mercado/Validacao_Mercado_2026.md` |

## Modelo de Negocios

| Item | Valor |
|------|-------|
| **Setup** | R$ 400 (unico, parcelavel 2x) |
| **Comissao** | 18% do faturamento bruto |
| **Manutencao** | Ate R$ 300/mes inclusos |
| **Contrato minimo** | 3 meses |
| **Multa rescisoria** | Nenhuma apos periodo inicial |

### Areas de Atuacao

- Porto Maravilha
- Centro
- Lapa
- Santa Teresa
- Catete / Flamengo (expansao)

## Proximos Passos

### Criticos (Antes do Deploy)

- [ ] Substituir numero de WhatsApp placeholder
- [ ] Configurar dominio gestaoportorio.com.br
- [ ] Configurar email profissional
- [ ] Validar convencao do condominio do studio piloto

### Curto Prazo

- [ ] Adicionar Google Analytics 4
- [ ] Adicionar Facebook Pixel
- [ ] Criar imagem OG para compartilhamento
- [ ] Testar em dispositivos reais

### Medio Prazo

- [ ] Implementar backend para salvar leads
- [ ] Criar dashboard para proprietarios
- [ ] Adicionar blog para SEO
- [ ] Integrar com PMS (Stays/Hostify)

## Stack Tecnologico

### Frontend
- HTML5 semantico
- CSS3 (Design System com variaveis)
- JavaScript Vanilla (ES6+)
- Google Fonts (Inter)

### Futuro Backend (Planejado)
- Node.js + Express
- MongoDB ou PostgreSQL
- API RESTful para leads
- Integracao Stays/Hostify

## Contatos

| Funcao | Nome | Contato |
|--------|------|---------|
| Gestora | Sabrina Costa | (21) XXXXX-XXXX |
| Estrategia | Marco | - |
| Email | - | contato@gestaoportorio.com.br |

## Licenca

Projeto privado - Todos os direitos reservados.

---

**Versao:** 2.0.0
**Atualizado:** Fevereiro 2026
