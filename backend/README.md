# Backend - Gestao Porto Rio

API para captacao de leads com integracao Evolution API (WhatsApp).

## Funcionalidades

- Armazena leads em banco SQLite
- Envia notificacao para o proprietario via WhatsApp
- Envia confirmacao automatica para o lead
- API REST para gerenciar leads

## Configuracao

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variaveis de ambiente

Edite o arquivo `.env`:

```env
# Configuracoes do Servidor
PORT=3001

# Evolution API
EVOLUTION_API_URL=https://qrcode.macspark.dev
EVOLUTION_API_KEY=sua_api_key_aqui
EVOLUTION_INSTANCE=nome_da_instancia

# WhatsApp do Proprietario
OWNER_WHATSAPP=5531975461540

# Enviar confirmacao para o lead
SEND_LEAD_CONFIRMATION=true
```

### 3. Obter API Key do Evolution

1. Acesse https://qrcode.macspark.dev/manager
2. Va em Configuracoes > API Key
3. Copie a chave e cole no `.env`

### 4. Iniciar servidor

```bash
# Producao
npm start

# Desenvolvimento (com hot reload)
npm run dev
```

## Endpoints da API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/leads` | Criar novo lead |
| `GET` | `/api/leads` | Listar todos os leads |
| `GET` | `/api/leads/:id` | Buscar lead por ID |
| `PATCH` | `/api/leads/:id` | Atualizar status |
| `GET` | `/api/stats` | Estatisticas |
| `POST` | `/api/leads/:id/notify` | Reenviar notificacao |

## Exemplo de Requisicao

### Criar Lead

```bash
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Joao Silva",
    "whatsapp": "(31) 99999-9999",
    "email": "joao@email.com",
    "tipo": "studio",
    "endereco": "Rua das Flores, 123 - Centro",
    "situacao": "vazio",
    "aluguel": 2000,
    "mensagem": "Tenho interesse"
  }'
```

### Listar Leads

```bash
curl http://localhost:3001/api/leads
```

### Estatisticas

```bash
curl http://localhost:3001/api/stats
```

## Status dos Leads

- `novo` - Recem cadastrado
- `em_contato` - Ja entrou em contato
- `qualificado` - Lead qualificado
- `proposta_enviada` - Proposta enviada
- `fechado` - Contrato fechado
- `perdido` - Lead perdido

## Fluxo de Notificacoes

1. Lead preenche formulario no site
2. Backend salva no banco de dados
3. Envia notificacao para proprietario (WhatsApp)
4. Envia confirmacao para o lead (opcional)

## Deploy em Producao

Para deploy, use PM2:

```bash
npm install -g pm2
pm2 start server.js --name gestao-porto-rio
pm2 save
pm2 startup
```

Ou Docker:

```bash
docker build -t gestao-backend .
docker run -d -p 3001:3001 --env-file .env gestao-backend
```

## Estrutura de Arquivos

```
backend/
├── server.js       # Servidor principal
├── leads.db        # Banco de dados SQLite (gerado automaticamente)
├── .env            # Configuracoes (NAO commitar)
├── .env.example    # Exemplo de configuracoes
├── package.json    # Dependencias
└── README.md       # Esta documentacao
```
