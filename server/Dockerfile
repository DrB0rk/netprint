FROM node:18-alpine
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build TypeScript files
RUN npm run build:backend

# Create uploads directory
RUN mkdir -p uploads

# Start the server using the compiled JS
EXPOSE 3001
CMD ["node", "--experimental-specifier-resolution=node", "dist/server/index.js"]