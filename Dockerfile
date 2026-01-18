# ================================================
# DOCKERFILE FRONTEND - BIS-GESPROJET
# ================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Ignorer NODE_ENV pendant l'installation pour avoir les devDependencies (vite, etc.)
ENV NODE_ENV=development

# Copier les fichiers de dépendances
COPY package.json ./

# Installer TOUTES les dépendances (y compris devDependencies pour vite)
RUN npm install --legacy-peer-deps

# Copier le code source
COPY . .

# Arguments de build (passés par Coolify)
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_APP_NAME=Time\ Tracker

# Variables d'environnement pour le build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# Remettre NODE_ENV à production pour le build optimisé
ENV NODE_ENV=production

# Build de production
RUN npm run build

# Stage 2: Serve avec nginx
FROM nginx:alpine

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]
