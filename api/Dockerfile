# Set the base image
FROM node:18

# Set the working directory in the Docker image
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy pnpm-lock.yaml (or package.json if you don't have pnpm-lock.yaml) to the working directory
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of your app's source code to the working directory
COPY . .

# Expose port 3000 for the app to be accessible
EXPOSE 3000

# Define the command to run your app
CMD [ "node", "src/index.js" ]
