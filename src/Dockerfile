FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY src/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*.html.br /usr/share/nginx/html/*.js.br /usr/share/nginx/html/*.css.br
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]