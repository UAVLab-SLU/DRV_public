#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${script_dir}"

load_token() {
    if [[ -n "${GITHUB_TOKEN:-}" ]]; then
        return 0
    fi
    if [[ -f .env ]]; then
        token_line="$(grep -m 1 '^GITHUB_TOKEN=' .env || true)"
        if [[ -n "${token_line}" ]]; then
            export GITHUB_TOKEN="${token_line#GITHUB_TOKEN=}"
            return 0
        fi
    fi
    echo "GITHUB_TOKEN is required when UAVLab-SLU/DRV-Unreal is private." >&2
    echo "Run './dev.sh token' or add it to .env." >&2
    return 1
}

set_token() {
    read -r -s -p "GitHub personal access token: " token
    echo
    if [[ -z "${token}" ]]; then
        echo "No token provided." >&2
        return 1
    fi

    if [[ -f .env ]] && grep -q '^GITHUB_TOKEN=' .env; then
        sed -i "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=${token}|" .env
    else
        printf '\nGITHUB_TOKEN=%s\n' "${token}" >> .env
    fi
    export GITHUB_TOKEN="${token}"
    echo "Saved GITHUB_TOKEN in .env."
}

set_pixelstream_public_ip() {
    if [[ -n "${PIXELSTREAM_PUBLIC_IP:-}" ]]; then
        return
    fi
    if [[ -f .env ]] && grep -q '^PIXELSTREAM_PUBLIC_IP=' .env; then
        PIXELSTREAM_PUBLIC_IP="$(grep -m 1 '^PIXELSTREAM_PUBLIC_IP=' .env | cut -d '=' -f2-)"
        export PIXELSTREAM_PUBLIC_IP
        return
    fi
    PIXELSTREAM_PUBLIC_IP="$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1; i<=NF; i++) if ($i == "src") {print $(i+1); exit}}')"
    export PIXELSTREAM_PUBLIC_IP="${PIXELSTREAM_PUBLIC_IP:-127.0.0.1}"
}

require_linux_simulator_host() {
    if [[ "$(uname -s)" != "Linux" ]]; then
        echo "The Dockerized Unreal simulator requires a native Linux NVIDIA host." >&2
        echo "Use './dev.sh dev' for the frontend/backend workflow on other platforms." >&2
        return 1
    fi

    if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
        echo "Docker Engine and Docker Compose v2 are required." >&2
        return 1
    fi

    docker_context="$(docker context show 2>/dev/null || true)"
    if [[ -z "${docker_context}" || "${docker_context}" == *desktop* ]]; then
        echo "The Unreal simulator requires the native Linux Docker Engine, not Docker Desktop." >&2
        echo "Select it with: docker context use default" >&2
        return 1
    fi

    if ! command -v nvidia-smi >/dev/null 2>&1 || ! nvidia-smi >/dev/null 2>&1; then
        echo "The host NVIDIA driver is unavailable. Fix 'nvidia-smi' before starting Unreal." >&2
        return 1
    fi

    if ! docker info --format '{{json .Runtimes}}' 2>/dev/null | grep -q '"nvidia"'; then
        echo "NVIDIA Container Toolkit is not registered with the native Docker Engine." >&2
        return 1
    fi
}

sync_unreal_release() {
    load_token
    echo "Checking the latest DRV-Unreal Linux release."
    "${script_dir}/download_sim_release.sh" latest
    DRV_RELEASE_TAG="$(<"${script_dir}/sim/release/.release-tag")"
    export DRV_RELEASE_TAG
}

build_and_validate_simulator() {
    echo "Building DRV-Unreal ${DRV_RELEASE_TAG}."
    docker compose --profile linux-simulator build drv-unreal
    echo "Validating native NVIDIA Vulkan in the DRV-Unreal image."
    docker run --rm --gpus all \
        --entrypoint vulkaninfo \
        droneworld/drv-unreal:linux --summary
}

print_usage() {
    echo "Usage: ./dev.sh COMMAND"
    echo
    echo "Commands:"
    echo "  token       Save the GitHub token used to read private releases"
    echo "  full        Linux NVIDIA only: validate, build, and start the full stack"
    echo "  dev         Start frontend and backend development services"
    echo "  frontend    Start the frontend"
    echo "  backend     Start the backend"
    echo "  simulator   Linux NVIDIA only: validate, build, and start Pixel Streaming"
    echo "  logs        Follow frontend and backend development logs"
    echo "  logs-all    Follow all service logs"
    echo "  stop        Stop the full stack"
    echo "  stop-dev    Stop development services"
    echo "  clean       Stop services and remove their volumes"
}

case "${1:-help}" in
    token)
        set_token
        ;;
    full)
        require_linux_simulator_host
        set_pixelstream_public_ip
        sync_unreal_release
        build_and_validate_simulator
        echo "Pixel Stream URL: http://localhost:${PIXELSTREAM_HTTP_PORT:-8888}"
        docker compose --profile linux-simulator up --no-build
        ;;
    dev)
        docker compose -f docker-compose.dev.yaml up
        ;;
    frontend)
        docker compose up frontend
        ;;
    backend)
        docker compose up backend
        ;;
    simulator)
        require_linux_simulator_host
        set_pixelstream_public_ip
        sync_unreal_release
        build_and_validate_simulator
        echo "Pixel Stream URL: http://localhost:${PIXELSTREAM_HTTP_PORT:-8888}"
        docker compose --profile linux-simulator up --no-build signalling drv-unreal
        ;;
    logs)
        docker compose -f docker-compose.dev.yaml logs -f frontend backend
        ;;
    logs-all)
        docker compose --profile linux-simulator logs -f
        ;;
    stop)
        docker compose --profile linux-simulator down
        ;;
    stop-dev)
        docker compose -f docker-compose.dev.yaml down
        ;;
    clean)
        docker compose --profile linux-simulator down -v
        docker compose -f docker-compose.dev.yaml down -v
        ;;
    help|"")
        print_usage
        ;;
    *)
        echo "Unknown command: $1" >&2
        print_usage
        exit 1
        ;;
esac
