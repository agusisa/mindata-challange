FROM node:lts

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Set working directory
WORKDIR /workspace

# Install git (might be needed)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1000 node \
    && useradd --uid 1000 --gid node --shell /bin/bash --create-home node

# Change ownership of workspace to node user
RUN chown -R node:node /workspace

# Switch to non-root user
USER node

# Expose Angular development port
EXPOSE 4200 