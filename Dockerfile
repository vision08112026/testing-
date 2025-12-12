# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 5000

# Health check (works even when PORT is injected by the platform)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const port=process.env.PORT||5000;require('http').get('http://localhost:'+port+'/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1));"

# Start application
CMD ["npm", "start"]
