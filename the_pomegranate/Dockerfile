FROM node:22-alpine

# Install openssl which is required by Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and workspace config
COPY package.json package-lock.json npm-workspace.yaml ./
# Copy all packages and services
COPY packages ./packages
COPY services ./services


# Install dependencies
RUN npm install

# Copy everything else (including schemas)
COPY . .

# Generate all Prisma clients for Alpine (musl)
RUN for file in $(find . -name "schema.prisma"); do npx prisma generate --schema=$file; done

# The workspace to run is passed via environment variable
ENV WORKSPACE=""

CMD ["sh", "-c", "npm --workspace=${WORKSPACE} run start"]
