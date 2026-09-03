# Etapa 1: Compilación de la Aplicación Angular con Node 22
FROM node:22-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias y ejecutar instalación limpia con Yarn
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-engines

# Copiar el código fuente y construir la versión de producción
COPY . .
RUN yarn build --configuration production

# Etapa 2: Servidor Nginx Optimizado
FROM nginx:alpine AS runtime

# Limpiar directorio html por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar artefactos generados de Angular 18 (salida en dist/frontend/browser)
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copiar configuración personalizada de Nginx con soporte SPA y Proxy hacia Backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
