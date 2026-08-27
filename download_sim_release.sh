#!/usr/bin/env bash
set -euo pipefail

owner="UAVLab-SLU"
repo="DRV-Unreal"
tag="${1:-latest}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sim_dir="${script_dir}/sim"
release_dir="${sim_dir}/release"
tmp_dir="$(mktemp -d)"
archive_path="${tmp_dir}/drv-unreal-linux.zip"

cleanup() {
    rm -rf "${tmp_dir}"
}
trap cleanup EXIT

for command_name in curl unzip python3; do
    if ! command -v "${command_name}" >/dev/null 2>&1; then
        echo "${command_name} is required" >&2
        exit 1
    fi
done

if [[ -z "${GITHUB_TOKEN:-}" && -f "${script_dir}/.env" ]]; then
    token_line="$(grep -m 1 '^GITHUB_TOKEN=' "${script_dir}/.env" || true)"
    if [[ -n "${token_line}" ]]; then
        export GITHUB_TOKEN="${token_line#GITHUB_TOKEN=}"
    fi
fi

auth_args=()
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    auth_args=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

api_url="https://api.github.com/repos/${owner}/${repo}/releases/latest"
if [[ "${tag}" != "latest" ]]; then
    api_url="https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}"
fi

metadata_path="${tmp_dir}/release.json"
status="$(curl --silent --show-error --location \
    --output "${metadata_path}" \
    --write-out '%{http_code}' \
    -H 'Accept: application/vnd.github+json' \
    -H 'X-GitHub-Api-Version: 2022-11-28' \
    "${auth_args[@]}" \
    "${api_url}" || true)"

if [[ ! "${status}" =~ ^2[0-9][0-9]$ ]]; then
    echo "GitHub release lookup failed with HTTP ${status}." >&2
    echo "If the repository is private, set GITHUB_TOKEN in .env and authorize organization SSO." >&2
    exit 1
fi

release_info="$(python3 - "${metadata_path}" <<'PY'
import json
import re
import sys

with open(sys.argv[1], encoding="utf-8") as stream:
    release = json.load(stream)

assets = [
    asset for asset in release.get("assets", [])
    if re.search(r"linux.*\.zip$", asset.get("name", ""), re.IGNORECASE)
]
assets.sort(key=lambda asset: asset.get("name", "").lower() != "linux.zip")
if not assets:
    names = ", ".join(asset.get("name", "") for asset in release.get("assets", []))
    raise SystemExit(f"Release {release.get('tag_name')} has no Linux zip asset. Available assets: {names}")

asset = assets[0]
print(release["tag_name"])
print(asset["name"])
print(asset["url"])
PY
)"

release_tag="$(printf '%s\n' "${release_info}" | sed -n '1p')"
asset_name="$(printf '%s\n' "${release_info}" | sed -n '2p')"
asset_url="$(printf '%s\n' "${release_info}" | sed -n '3p')"

if [[ -f "${release_dir}/.release-tag" ]] \
    && [[ "$(<"${release_dir}/.release-tag")" == "${release_tag}" ]] \
    && find "${release_dir}" -type f \( -name DRV.sh -o -name Blocks.sh -o -name SADE_drone_rep.sh \) -print -quit | grep -q .; then
    echo "DRV-Unreal ${release_tag} is already current."
    exit 0
fi

echo "Downloading ${asset_name} from release ${release_tag}"
curl --fail --location \
    -H 'Accept: application/octet-stream' \
    "${auth_args[@]}" \
    "${asset_url}" \
    --output "${archive_path}"

extract_dir="${tmp_dir}/extract"
mkdir -p "${extract_dir}" "${sim_dir}"
unzip -q "${archive_path}" -d "${extract_dir}"

launcher=""
for launcher_name in DRV.sh Blocks.sh SADE_drone_rep.sh; do
    launcher="$(find "${extract_dir}" -type f -name "${launcher_name}" -print -quit)"
    [[ -n "${launcher}" ]] && break
done
if [[ -z "${launcher}" ]]; then
    echo "The Linux archive does not contain a supported Unreal launcher." >&2
    exit 1
fi

staging_dir="${sim_dir}/release-staging-$$"
mkdir -p "${staging_dir}"
cp -a "$(dirname "${launcher}")/." "${staging_dir}/"
printf '%s' "${release_tag}" > "${staging_dir}/.release-tag"
printf '%s' "${asset_name}" > "${staging_dir}/.release-asset"

case "${release_dir}" in
    "${sim_dir}/release") rm -rf "${release_dir}" ;;
    *) echo "Refusing to replace unexpected release path: ${release_dir}" >&2; exit 1 ;;
esac
mv "${staging_dir}" "${release_dir}"
echo "Installed DRV-Unreal ${release_tag} into ${release_dir}"
