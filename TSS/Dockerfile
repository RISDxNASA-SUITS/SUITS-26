FROM debian:bookworm-slim

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    build-essential \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN chmod +x build.bat \
 && ./build.bat \
 && chmod +x server.exe

EXPOSE 14141
EXPOSE 14141/udp

CMD ["./server.exe"]