/**
 * Backend - Gestao Porto Rio
 * API para captacao de leads com integracao Evolution API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ===========================================
// DATABASE SETUP
// ===========================================

const db = new Database(path.join(__dirname, 'leads.db'));

// Criar tabela de leads
db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        email TEXT,
        tipo_imovel TEXT,
        endereco TEXT,
        situacao TEXT,
        aluguel_tradicional INTEGER,
        mensagem TEXT,
        origem TEXT DEFAULT 'landing_page',
        status TEXT DEFAULT 'novo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notificacao_enviada BOOLEAN DEFAULT 0,
        confirmacao_enviada BOOLEAN DEFAULT 0
    )
`);

console.log('Database initialized');

// ===========================================
// EVOLUTION API INTEGRATION
// ===========================================

const evolutionApi = axios.create({
    baseURL: process.env.EVOLUTION_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY
    }
});

/**
 * Envia mensagem via Evolution API
 */
async function sendWhatsAppMessage(phone, message) {
    try {
        // Formata o numero (remove caracteres especiais)
        const formattedPhone = phone.replace(/\D/g, '');

        // Adiciona 55 se nao tiver
        const fullPhone = formattedPhone.startsWith('55')
            ? formattedPhone
            : `55${formattedPhone}`;

        const response = await evolutionApi.post(
            `/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
            {
                number: fullPhone,
                text: message
            }
        );

        console.log(`Mensagem enviada para ${fullPhone}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Notifica o proprietario sobre novo lead
 */
async function notifyOwner(lead) {
    const message = `🏠 *NOVO LEAD - Gestao Porto Rio*

📋 *Dados do Interessado:*
• Nome: ${lead.nome}
• WhatsApp: ${lead.whatsapp}
• Email: ${lead.email || 'Nao informado'}

🏢 *Dados do Imovel:*
• Tipo: ${lead.tipo_imovel || 'Nao informado'}
• Endereco: ${lead.endereco || 'Nao informado'}
• Situacao: ${lead.situacao || 'Nao informado'}
• Aluguel tradicional: ${lead.aluguel_tradicional ? `R$ ${lead.aluguel_tradicional}` : 'Nao informado'}

💬 *Observacoes:*
${lead.mensagem || 'Nenhuma'}

⏰ Recebido em: ${new Date().toLocaleString('pt-BR')}

_Responda em ate 48h conforme prometido no site!_`;

    return await sendWhatsAppMessage(process.env.OWNER_WHATSAPP, message);
}

/**
 * Envia confirmacao para o lead
 */
async function sendLeadConfirmation(lead) {
    if (process.env.SEND_LEAD_CONFIRMATION !== 'true') {
        return { success: false, reason: 'Confirmacao desabilitada' };
    }

    const message = `Ola ${lead.nome.split(' ')[0]}! 👋

Recebemos sua solicitacao de analise para gestao de Airbnb.

✅ *Proximos passos:*
• Em ate 48h entraremos em contato
• Faremos uma analise personalizada do seu imovel
• Apresentaremos uma projecao de receita

Enquanto isso, se tiver alguma duvida, pode responder esta mensagem!

_Gestao Porto Rio - Seu imovel rendendo mais_ 🏠`;

    return await sendWhatsAppMessage(lead.whatsapp, message);
}

// ===========================================
// API ROUTES
// ===========================================

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

/**
 * Criar novo lead
 */
app.post('/api/leads', async (req, res) => {
    try {
        const {
            nome,
            whatsapp,
            email,
            tipo,
            endereco,
            situacao,
            aluguel,
            mensagem
        } = req.body;

        // Validacao basica
        if (!nome || !whatsapp) {
            return res.status(400).json({
                success: false,
                error: 'Nome e WhatsApp sao obrigatorios'
            });
        }

        // Inserir no banco
        const stmt = db.prepare(`
            INSERT INTO leads (nome, whatsapp, email, tipo_imovel, endereco, situacao, aluguel_tradicional, mensagem)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            nome,
            whatsapp,
            email || null,
            tipo || null,
            endereco || null,
            situacao || null,
            aluguel ? parseInt(aluguel) : null,
            mensagem || null
        );

        const leadId = result.lastInsertRowid;

        // Buscar o lead completo
        const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);

        console.log(`Novo lead cadastrado: #${leadId} - ${nome}`);

        // Enviar notificacoes em background (nao bloqueia resposta)
        (async () => {
            // Notificar proprietario
            const ownerResult = await notifyOwner(lead);
            if (ownerResult.success) {
                db.prepare('UPDATE leads SET notificacao_enviada = 1 WHERE id = ?').run(leadId);
            }

            // Enviar confirmacao para o lead
            const confirmResult = await sendLeadConfirmation(lead);
            if (confirmResult.success) {
                db.prepare('UPDATE leads SET confirmacao_enviada = 1 WHERE id = ?').run(leadId);
            }
        })();

        res.status(201).json({
            success: true,
            message: 'Lead cadastrado com sucesso',
            leadId: leadId
        });

    } catch (error) {
        console.error('Erro ao cadastrar lead:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Listar todos os leads
 */
app.get('/api/leads', (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM leads';
        const params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const leads = db.prepare(query).all(...params);
        const total = db.prepare('SELECT COUNT(*) as count FROM leads').get();

        res.json({
            success: true,
            data: leads,
            total: total.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Erro ao listar leads:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Buscar lead por ID
 */
app.get('/api/leads/:id', (req, res) => {
    try {
        const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead nao encontrado'
            });
        }

        res.json({
            success: true,
            data: lead
        });

    } catch (error) {
        console.error('Erro ao buscar lead:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Atualizar status do lead
 */
app.patch('/api/leads/:id', (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['novo', 'em_contato', 'qualificado', 'proposta_enviada', 'fechado', 'perdido'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Status invalido. Use: ${validStatuses.join(', ')}`
            });
        }

        const stmt = db.prepare(`
            UPDATE leads
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        const result = stmt.run(status, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Lead nao encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Lead atualizado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar lead:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Estatisticas dos leads
 */
app.get('/api/stats', (req, res) => {
    try {
        const stats = {
            total: db.prepare('SELECT COUNT(*) as count FROM leads').get().count,
            novos: db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'novo'").get().count,
            em_contato: db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'em_contato'").get().count,
            fechados: db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'fechado'").get().count,
            hoje: db.prepare("SELECT COUNT(*) as count FROM leads WHERE date(created_at) = date('now')").get().count,
            semana: db.prepare("SELECT COUNT(*) as count FROM leads WHERE created_at >= date('now', '-7 days')").get().count
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Erro ao buscar estatisticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Reenviar notificacao para um lead
 */
app.post('/api/leads/:id/notify', async (req, res) => {
    try {
        const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead nao encontrado'
            });
        }

        const result = await notifyOwner(lead);

        if (result.success) {
            db.prepare('UPDATE leads SET notificacao_enviada = 1 WHERE id = ?').run(req.params.id);
        }

        res.json({
            success: result.success,
            message: result.success ? 'Notificacao enviada' : 'Erro ao enviar notificacao',
            error: result.error
        });

    } catch (error) {
        console.error('Erro ao reenviar notificacao:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// ===========================================
// START SERVER
// ===========================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   Gestao Porto Rio - Backend API              ║
║   Servidor rodando na porta ${PORT}              ║
╠═══════════════════════════════════════════════╣
║   Endpoints:                                  ║
║   • POST   /api/leads      - Criar lead       ║
║   • GET    /api/leads      - Listar leads     ║
║   • GET    /api/leads/:id  - Buscar lead      ║
║   • PATCH  /api/leads/:id  - Atualizar lead   ║
║   • GET    /api/stats      - Estatisticas     ║
║   • GET    /api/health     - Health check     ║
╚═══════════════════════════════════════════════╝
    `);
});
