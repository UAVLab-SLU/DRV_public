FROM python:3.8.1-buster AS legacy-openssl

FROM nvidia/cuda:12.8.0-base-ubuntu24.04

ARG DEBIAN_FRONTEND=noninteractive
ARG DRV_RELEASE_TAG=unknown

LABEL org.opencontainers.image.title="DRV-Unreal Linux runtime" \
      org.opencontainers.image.version="${DRV_RELEASE_TAG}"

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gosu \
        libasound2t64 \
        libfontconfig1 \
        libgl1 \
        libglu1-mesa \
        libnss3 \
        libpulse0 \
        libsdl2-2.0-0 \
        libvulkan1 \
        libx11-6 \
        libxau6 \
        libxcb1 \
        libxcursor1 \
        libxdmcp6 \
        libxext6 \
        libxi6 \
        libxinerama1 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        net-tools \
        procps \
        vulkan-tools \
        xdg-user-dirs \
    && rm -rf /var/lib/apt/lists/*

# Some packaged UE plugins still link against OpenSSL 1.1. Copy the compatible
# libraries without adding an obsolete package repository to the runtime image.
COPY --from=legacy-openssl /usr/lib/x86_64-linux-gnu/libssl.so.1.1 /usr/lib/x86_64-linux-gnu/libssl.so.1.1
COPY --from=legacy-openssl /usr/lib/x86_64-linux-gnu/libcrypto.so.1.1 /usr/lib/x86_64-linux-gnu/libcrypto.so.1.1

RUN useradd --create-home --shell /bin/bash unreal \
    && mkdir -p /home/unreal/Documents/AirSim /opt/drv \
    && chown -R unreal:unreal /home/unreal /opt/drv

WORKDIR /opt/drv

# Populated by download_sim_release.ps1 or download_sim_release.sh.
COPY --chown=unreal:unreal release/ /opt/drv/
COPY nvidia_icd.json /etc/vulkan/icd.d/nvidia_icd.json
COPY docker-entrypoint.sh /usr/local/bin/drv-entrypoint

RUN set -eux; \
    launcher="$(find /opt/drv -type f \( -name 'DRV.sh' -o -name 'Blocks.sh' -o -name 'SADE_drone_rep.sh' \) | head -n 1)"; \
    test -n "$launcher" || (echo 'No Unreal launcher found. Run the release downloader before building.' >&2; exit 1); \
    chmod +x "$launcher" /usr/local/bin/drv-entrypoint; \
    ln -s "$launcher" /opt/drv/launch.sh

# NVIDIA Container Toolkit injects host-matched graphics, Vulkan, and NVENC
# libraries into these locations when the capabilities include them.
ENV HOME=/home/unreal \
    LD_LIBRARY_PATH=/usr/local/nvidia/lib:/usr/local/nvidia/lib64 \
    NVIDIA_DRIVER_CAPABILITIES=compute,utility,graphics,video,display \
    NVIDIA_VISIBLE_DEVICES=all \
    SDL_AUDIODRIVER=dummy \
    SDL_VIDEODRIVER=offscreen \
    VK_DRIVER_FILES=/etc/vulkan/icd.d/nvidia_icd.json \
    XDG_RUNTIME_DIR=/tmp/runtime-unreal

EXPOSE 3000 41451

ENTRYPOINT ["/usr/local/bin/drv-entrypoint"]
CMD ["-AudioMixer", "-RenderOffscreen", "-PixelStreamingURL=ws://signalling:8888", "-ResX=1920", "-ResY=1080", "-ForceRes", "-Unattended", "-NoSplash", "-StdOut", "-FullStdOutLogOutput", "-PixelStreamingWebRTCMinPort=49160", "-PixelStreamingWebRTCMaxPort=49200"]
