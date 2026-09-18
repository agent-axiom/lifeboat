#!/bin/bash
# Prepare a Developer ID-signed release image; uploading to Apple is opt-in.
set -euo pipefail
umask 077

die() { printf 'Error: %s\n' "$*" >&2; exit 1; }
usage() {
  cat <<'USAGE'
Usage: bash scripts/notarize-macos.sh studio|player SOURCE_DIRECTORY OUTPUT_DIRECTORY
       [--submit-reviewed-public-artifact]

Required environment:
  LIFEBOAT_MACOS_SIGNING_IDENTITY  SHA-1 of a Developer ID Application identity
  LIFEBOAT_NOTARY_PROFILE         Keychain profile name (only for submission)

SOURCE_DIRECTORY must be a fresh, reviewed, public release folder, not a
workspace you have run or a private export. OUTPUT_DIRECTORY must not exist.
The script copies the source, signs the copy, and creates a candidate DMG.
The optional flag sends the entire DMG to Apple's notarization service.
No passwords or private keys are accepted as arguments or read from .env.
No upload to GitHub, security bypass, or user installation is performed.
USAGE
}

if [[ "${1:-}" == --help || "${1:-}" == -h ]]; then usage; exit 0; fi
[[ $# -ge 3 && $# -le 4 ]] || { usage >&2; exit 2; }
product=$1
source_dir=$2
output_dir=$3
submit=${4:-}
case "$submit" in ''|--submit-reviewed-public-artifact) ;; *) die 'Unknown submission option.' ;; esac
case "$product" in
  studio)
    folder=Lifeboat-Studio
    artifact=lifeboat-studio-macos
    launcher='Start Lifeboat Studio.command'
    binaries=(lifeboat-player lifeboat-studio)
    ;;
  player)
    folder=Lifeboat
    artifact=lifeboat-player-macos
    launcher='Start Lifeboat.command'
    binaries=(lifeboat-player)
    ;;
  *) die 'Product must be studio or player.' ;;
esac

[[ "$(/usr/bin/uname -s)" == Darwin ]] || die 'macOS is required.'
[[ -d "$source_dir" && ! -L "$source_dir" ]] || die 'Source must be a real directory.'
source_dir=$(cd "$source_dir" && pwd -P)
[[ -f "$source_dir/$launcher" ]] || die "Missing $launcher."
for binary in "${binaries[@]}"; do
  [[ -f "$source_dir/$binary" && -x "$source_dir/$binary" ]] || die "Missing executable: $binary."
  case "$(/usr/bin/file -b "$source_dir/$binary")" in
    *Mach-O*) ;;
    *) die "$binary is not a macOS binary." ;;
  esac
done

# Fail closed on common credentials and state created by a previous launch.
# This is not a substitute for reviewing the complete contents before upload.
unsafe=$(/usr/bin/find "$source_dir" \( \
  -type l -o -name '.env' -o \( -name '.env.*' ! -name '.env.example' \) \
  -o -name '*.p8' -o -name '*.p12' -o -name '*.pfx' -o -name '*.pem' \
  -o -name '*.key' -o -name '.git' -o -name '.DS_Store' \
  -o -name 'workspaces' -o -name '.player.lock' \
  -o -name '*-wal' -o -name '*-shm' \
  \) -print -quit)
[[ -z "$unsafe" ]] || die 'Source contains a symlink, possible credential, or runtime state. Use a fresh release folder; do not remove quarantine.'

identity=${LIFEBOAT_MACOS_SIGNING_IDENTITY:-}
[[ "$identity" =~ ^[[:xdigit:]]{40}$ ]] || die 'Set LIFEBOAT_MACOS_SIGNING_IDENTITY to a Developer ID Application identity SHA-1.'
matching_identity=$(/usr/bin/security find-identity -v -p codesigning |
  /usr/bin/awk -v identity="$identity" 'toupper($2) == toupper(identity) && /"Developer ID Application:/ { print $2 }')
[[ -n "$matching_identity" ]] || die 'The selected valid Developer ID Application identity is not available in Keychain.'
if [[ -n "$submit" ]]; then
  [[ -n "${LIFEBOAT_NOTARY_PROFILE:-}" ]] || die 'Set LIFEBOAT_NOTARY_PROFILE to an existing notarytool Keychain profile.'
  /usr/bin/xcrun --find notarytool >/dev/null
  /usr/bin/xcrun --find stapler >/dev/null
fi

[[ ! -e "$output_dir" && ! -L "$output_dir" ]] || die 'Output already exists; choose a new directory.'
output_parent=$(/usr/bin/dirname "$output_dir")
output_name=$(/usr/bin/basename "$output_dir")
/bin/mkdir -p "$output_parent"
output_parent=$(cd "$output_parent" && pwd -P)
output_dir="$output_parent/$output_name"
case "$output_dir/" in "$source_dir/"*) die 'Output must be outside the source directory.' ;; esac
/bin/mkdir "$output_dir"
/bin/mkdir "$output_dir/staging"
copy="$output_dir/staging/$folder"
/usr/bin/ditto "$source_dir" "$copy"

# Sign the embedded Player too: Studio must not package an ad-hoc runtime.
# Never sign the original input or weaken the user's security configuration.
for binary in "${binaries[@]}"; do
  /usr/bin/codesign --force --sign "$identity" --timestamp --options runtime \
    --identifier "io.github.agent-axiom.lifeboat.$binary" "$copy/$binary"
  /usr/bin/codesign --verify --strict --verbose=2 "$copy/$binary"
done

cat > "$output_dir/staging/START-HERE.txt" <<EOF
Lifeboat macOS preview

Copy the entire $folder folder from this disk image to a writable location,
such as Documents, before opening $launcher inside the copied folder.
Keep its contents together. The mounted disk image is read-only; Lifeboat
needs a writable folder for local data and workspaces.

If macOS blocks the application, stop and use the browser sample at
https://agent-axiom.github.io/lifeboat/ instead. Do not disable Gatekeeper,
remove quarantine, or override a security warning to use this preview.

A notarization ticket is a distribution check, not evidence that all
Lifeboat workflows or installation environments have been tested.
EOF

candidate="$output_dir/$artifact.candidate.dmg"
/usr/bin/hdiutil create -srcfolder "$output_dir/staging" -volname "$folder" \
  -format UDZO -fs HFS+ "$candidate"
/usr/bin/codesign --sign "$identity" --timestamp \
  --identifier "io.github.agent-axiom.lifeboat.$product.distribution" "$candidate"
/usr/bin/codesign --verify --verbose=2 "$candidate"

if [[ -z "$submit" ]]; then
  printf 'Signed candidate only; not notarized and not ready to publish:\n%s\n' "$candidate"
  printf 'Review all release contents before explicitly opting into submission to Apple.\n'
  exit 0
fi

printf 'Submitting the reviewed public release image to Apple. No GitHub publication will occur.\n'
result="$output_dir/notary-result.plist"
if ! /usr/bin/xcrun notarytool submit "$candidate" \
    --keychain-profile "$LIFEBOAT_NOTARY_PROFILE" --output-format plist \
    --wait --timeout 20m > "$result"; then
  die "Notarization did not finish successfully. Keep $output_dir and inspect the submission before retrying; a timeout does not cancel Apple's processing."
fi
status=$(/usr/bin/plutil -extract status raw -o - "$result")
[[ "$status" == Accepted ]] || die "Apple returned status '$status'. The candidate must not be published. See $result."
/usr/bin/xcrun stapler staple "$candidate"
/usr/bin/xcrun stapler validate "$candidate"
/usr/sbin/spctl --assess --type open --context context:primary-signature \
  --verbose=2 "$candidate"

final="$artifact.notarized.dmg"
/bin/mv "$candidate" "$output_dir/$final"
(cd "$output_dir" && /usr/bin/shasum -a 256 "$final" > SHA256SUMS)
printf 'Notarization and container assessment completed:\n%s\n' "$output_dir/$final"
printf 'Before publication, test a fresh browser download on another Mac without security exceptions.\n'
printf 'A generated Player ZIP is a separate delivery path and still needs its own validation.\n'
