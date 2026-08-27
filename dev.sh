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
        export PIXELSTREAM_PUBLIC_IP="$(grep -m 1 '^PIXELSTREAM_PUBLIC_IP=' .env | cut -d '=' -f2-)"
        return
    fi
    PIXELSTREAM_PUBLIC_IP="$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1; i<=NF; i++) if ($i == "src") {print $(i+1); exit}}')"
    export PIXELSTREAM_PUBLIC_IP="${PIXELSTREAM_PUBLIC_IP:-127.0.0.1}"
}

sync_unreal_release() {
    load_token
    echo "Checking the latest DRV-Unreal Linux release."
    "${script_dir}/download_sim_release.sh" latest
    export DRV_RELEASE_TAG="$(<"${script_dir}/sim/release/.release-tag")"
}

print_usage() {
    echo "Usage: ./dev.sh COMMAND"
    echo
    echo "Commands:"
    echo "  token       Save the GitHub token used to read private releases"
    echo "  full        Download the latest simulator and start the full stack"
    echo "  dev         Start frontend and backend development services"
    echo "  frontend    Start the frontend"
    echo "  backend     Start the backend"
    echo "  simulator   Download the latest simulator and start Pixel Streaming"
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
        set_pixelstream_public_ip
        sync_unreal_release
        echo "Pixel Stream URL: http://localhost:${PIXELSTREAM_HTTP_PORT:-8888}"
        docker compose up --build
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
        set_pixelstream_public_ip
        sync_unreal_release
        echo "Pixel Stream URL: http://localhost:${PIXELSTREAM_HTTP_PORT:-8888}"
        docker compose up --build signalling drv-unreal
        ;;
    logs)
        docker compose -f docker-compose.dev.yaml logs -f frontend backend
        ;;
    logs-all)
        docker compose logs -f
        ;;
    stop)
        docker compose down
        ;;
    stop-dev)
        docker compose -f docker-compose.dev.yaml down
        ;;
    clean)
        docker compose down -v
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
