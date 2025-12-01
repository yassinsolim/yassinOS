# ---------- build stage ----------
FROM node:20-bullseye AS build

# Work in /app
WORKDIR /app

# System deps for Next.js build / node-gyp, etc.
RUN apt-get update && \
    apt-get install -y git python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

# Use corepack to get stable yarn v1
RUN corepack enable

# Fix old webpack/OpenSSL issues (browserfs, etc.)
ENV NODE_OPTIONS=--openssl-legacy-provider

# 1) Install JS deps (cached layer)
COPY package.json yarn.lock ./
RUN corepack prepare yarn@1.22.22 --activate && \
    YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install --frozen-lockfile

# 2) Copy rest of the source
COPY . .

# 3) Build the Next.js app
RUN yarn build

# ---------- runtime stage ----------
# ---------- build stage ----------
FROM node:20-bullseye AS build

# Work in /app
WORKDIR /app

# System deps for Next.js build / node-gyp, etc.
RUN apt-get update && \
    apt-get install -y git python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

# Use corepack to get stable yarn v1
RUN corepack enable

# Fix old webpack/OpenSSL issues (browserfs, etc.)
ENV NODE_OPTIONS=--openssl-legacy-provider

# 1) Install JS deps (cached layer)
COPY package.json yarn.lock ./
RUN corepack prepare yarn@1.22.22 --activate && \
    YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install --frozen-lockfile

# 2) Copy rest of the source
COPY . .

# 3) Build the Next.js app
RUN yarn build

# ---------- runtime stage ----------
FROM node:20-bullseye AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--openssl-legacy-provider

# Copy the built app from the build stage
COPY --from=build /app ./

# daedalOS/yassinOS listens on 3000
EXPOSE 3000

# Start the Next.js server
CMD ["yarn", "start"]
