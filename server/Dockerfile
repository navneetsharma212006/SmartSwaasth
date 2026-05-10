FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "src/index.js"]
