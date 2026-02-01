FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar codigo fonte
COPY server.js ./

# Criar diretorio para o banco de dados
RUN mkdir -p /app/data

# Expor porta
EXPOSE 3005

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3005/api/health || exit 1

# Iniciar servidor
CMD ["node", "server.js"]
