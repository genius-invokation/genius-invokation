# Multi-stage build for C binding
# Stage 1: Generate JavaScript code bundle
FROM oven/bun:1-alpine AS js-builder

WORKDIR /workspace

# Copy workspace root files needed for monorepo
COPY package.json bun.lockb ./
COPY packages/core packages/core
COPY packages/data packages/data
COPY packages/typings packages/typings
COPY packages/utils packages/utils
COPY packages/cbinding packages/cbinding

# Install dependencies and build JavaScript bundle
WORKDIR /workspace/packages/cbinding
RUN bun install && bun run build

# Stage 2: Build C binding library
FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    ninja-build \
    g++ \
    git \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy generated JavaScript code from previous stage
COPY --from=js-builder /workspace/packages/cbinding/generated ./generated

# Copy C binding source files
COPY packages/cbinding/CMakeLists.txt .
COPY packages/cbinding/include ./include
COPY packages/cbinding/src ./src
COPY packages/cbinding/test ./test

# Configure, build and install
RUN cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build --config Release && \
    cmake --install build --prefix /install --config Release

# Stage 3: Runtime image with built library
FROM ubuntu:22.04

WORKDIR /app

# Copy built library and headers
COPY --from=builder /install /usr/local

# Copy test executable for verification
COPY --from=builder /build/build/gitcg-cbinding-test /app/test

# Set library path
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

# Run test by default
CMD ["/app/test"]
