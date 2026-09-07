#!/usr/bin/env bash
set -euo pipefail

runtime_dir="${XDG_RUNTIME_DIR:-/tmp/runtime-unreal}"
dronelume_mount="${DRONELUME_CONFIG_DIR:-/opt/drv/dronelume-config}"
dronelume_runtime_file_name="${DRONELUME_RUNTIME_FILE_NAME:-initDSL_ActiveShooter.json}"
if [[ "${dronelume_runtime_file_name}" == */* || "${dronelume_runtime_file_name}" == *\\* ]]; then
    echo "DRONELUME_RUNTIME_FILE_NAME must be a file name without directory components." >&2
    exit 1
fi
launcher_path="$(readlink -f /opt/drv/launch.sh)"
launcher_dir="$(dirname "${launcher_path}")"
project_name="$(basename "${launcher_path}" .sh)"

if [[ -d "${launcher_dir}/${project_name}" ]]; then
    dronelume_runtime_config="${launcher_dir}/${project_name}/Config"
else
    dronelume_runtime_config="${launcher_dir}/Config"
fi

mkdir -p "${runtime_dir}" /home/unreal/Documents/AirSim "${dronelume_mount}" "${dronelume_runtime_config}"
ln -sfn "${dronelume_mount}/InitDSL.json" "${dronelume_runtime_config}/InitDSL.json"
ln -sfn "${dronelume_mount}/${dronelume_runtime_file_name}" "${dronelume_runtime_config}/${dronelume_runtime_file_name}"
chmod 700 "${runtime_dir}"

while IFS= read -r saved_dir; do
    chown -R unreal:unreal "${saved_dir}" || true
done < <(find /opt/drv -type d -path '*/Saved' 2>/dev/null)

chown -R unreal:unreal "${runtime_dir}" /home/unreal/Documents/AirSim
ulimit -n 2560

if [[ "${1:-}" == "bash" || "${1:-}" == "sh" || "${1:-}" == /* ]]; then
    exec gosu unreal "$@"
fi

if [[ "${DRV_SKIP_GPU_PREFLIGHT:-0}" != "1" ]]; then
    if ! vulkan_summary="$(gosu unreal vulkaninfo --summary 2>&1)"; then
        echo "Vulkan preflight failed:" >&2
        echo "${vulkan_summary}" >&2
        exit 1
    fi

    if grep -Eqi 'Dozen|llvmpipe|PHYSICAL_DEVICE_TYPE_CPU' <<<"${vulkan_summary}"; then
        echo "Unsupported Vulkan driver detected. DRV-Unreal requires a native NVIDIA Vulkan device." >&2
        echo "${vulkan_summary}" >&2
        exit 1
    fi

    if ! grep -qi 'NVIDIA' <<<"${vulkan_summary}"; then
        echo "No native NVIDIA Vulkan device was detected." >&2
        echo "${vulkan_summary}" >&2
        exit 1
    fi
fi

exec gosu unreal /opt/drv/launch.sh "$@"
