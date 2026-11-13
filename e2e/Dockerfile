# The browser tests' image: Playwright's (with its browsers) and these tests.
# rendimiento builds it with each release (builds: e2e) and runs it once
# the release is live (tests:).
FROM mcr.microsoft.com/playwright:v1.64.1-noble
WORKDIR /pruebas
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
