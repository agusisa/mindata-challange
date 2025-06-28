FROM node:lts

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Set working directory
WORKDIR /workspace

# Install git (might be needed)
RUN apt-get update && apt-get install -y git

# Expose Angular development port
EXPOSE 4200 