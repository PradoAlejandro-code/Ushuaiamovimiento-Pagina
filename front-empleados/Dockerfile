FROM node:20-alpine as build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# --- ETAPA 2: El Servidor (Nginx) --
FROM nginx:alpine
# 1. Copiamos nuestra configuración mágica de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 2. Copiamos lo que fabricó la etapa "build" (Etapa 1)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]