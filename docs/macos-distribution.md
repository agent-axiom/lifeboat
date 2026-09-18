# macOS distribution: release gate

## Current status

The September 18 browser-download check was blocked by Gatekeeper. The
published preview is not Developer ID-signed or notarized. The earlier
standalone execution result does not prove that a new customer can install it.

No valid code-signing identity was visible to the current local signing
environment. `notarytool` and `stapler` are installed. The preparation script
below has not been executed end to end, and no notarized release has been
published. Adding this script does not resolve or remove the existing warning.

## Distribution approach

Use a Developer ID Application signature with a secure timestamp and Hardened
Runtime on both macOS executables. For Studio, sign its embedded Player as
well. Package the reviewed release folder in a signed DMG, submit the image
to Apple's notary service, require an Accepted result, and staple the ticket
to the DMG before generating the final checksum.

The current command-file launcher and writable-folder layout are retained.
Users must copy the complete folder out of the read-only image before launch.
This is a distribution preparation path, not a new native app-bundle UI.

Do not strip quarantine, disable Gatekeeper, publish an ad-hoc signature as
Developer ID, or treat a successful `codesign --verify` as a clean-install test.
Do not use `sudo` for signing.

## Prerequisites controlled by the maintainer

1. Apple Developer Program access and a valid Developer ID Application
   certificate with its private key available in the local Keychain.
2. An existing `notarytool` Keychain profile for that developer team.
3. Fresh, unrun release folders containing only reviewed public content.
4. A separate Mac or fresh test environment for the actual browser-download
   installation path, without previously approved security exceptions.

Do not put signing keys, Apple passwords, or notary credentials in the source
tree, `.env`, chat, screenshots, or GitHub. Use Apple's interactive Keychain
credential setup; the helper takes only an identity fingerprint and profile
name. It does not create certificates, enroll an account, accept agreements,
or store credentials for you.

## Prepare a candidate

Find the public identity fingerprint with:

```sh
security find-identity -v -p codesigning
```

Select a valid `Developer ID Application` identity, not Apple Development or
Developer ID Installer. Set its fingerprint in the environment, then prepare
a candidate using a fresh release folder:

```sh
export LIFEBOAT_MACOS_SIGNING_IDENTITY='YOUR_DEVELOPER_ID_APPLICATION_SHA1'
bash scripts/notarize-macos.sh studio /absolute/path/Lifeboat-Studio dist/macos/studio-candidate
```

For the ready-made Player, use `player` and the fresh `Lifeboat` directory.
Never use a directory already launched for testing: it may contain workspaces,
database journals, private data, or API configuration. Input is copied, not
modified. Output must be a new directory outside input. Known secret and
runtime-state filenames and symlinks are rejected, but this is not a complete
secret scanner: review every included file before any submission.

Signing changes executable bytes. Preserve the source snapshot and accepted
contract; update any binary-specific release metadata as necessary. Replace
neither existing public assets nor published checksums silently. Use a new
release version for a signed distribution.

## Explicit submission

The following opt-in sends the entire reviewed public release image to Apple.
Do not use it for a customer's private export. It creates a new candidate,
submits it, requires acceptance, staples the ticket, assesses the container,
and writes a checksum only after those gates succeed:

```sh
export LIFEBOAT_NOTARY_PROFILE='YOUR_EXISTING_KEYCHAIN_PROFILE_NAME'
bash scripts/notarize-macos.sh studio /absolute/path/Lifeboat-Studio dist/macos/studio-release \
  --submit-reviewed-public-artifact
```

The helper never uploads to GitHub. A `.candidate.dmg` is not a release.
If processing times out, retain the output and inspect the existing submission
with `notarytool history`, `info`, and `log` before resubmitting. A timeout does
not cancel Apple's work. Resolve rejection details rather than using `--force`.

## Remaining acceptance gates

1. Download the new DMG through a browser on another Mac; preserve quarantine.
2. Open it normally, copy the complete release folder to a writable location,
   and launch with no security overrides. A terminal-based launch must also
   be assessed for onboarding friction; notarization is not a UX fix.
3. For Studio, exercise the no-AI import, preview, acceptance, and package flow.
4. Test the generated Player ZIP as its own fresh download. Notarizing Studio
   does not by itself establish that this delivery path works on a new Mac.
5. Test the signed ready-made Player with Studio stopped, no API key, and
   external networking denied; edit, restart, export, and compare the original
   snapshot checksum.
6. Record architecture and OS version, distribution checksum, result, and
   limitations. Only then update public download links and installation claims.

The helper does not change Studio's ZIP generator. A copied notarized runtime
is not a stapled ZIP distribution, and a modified or re-signed runtime needs
fresh consideration. The dynamic Player path may need an independently
notarized launcher/app packaging design; do not upload private user data to
Apple automatically. Resolve and test this separately before claiming all
generated downloads are installable offline.

## Apple references

- [Creating distribution-signed code](https://developer.apple.com/documentation/xcode/creating-distribution-signed-code-for-the-mac)
- [Packaging Mac software for distribution](https://developer.apple.com/documentation/xcode/packaging-mac-software-for-distribution)
- [Customizing the notarization workflow](https://developer.apple.com/documentation/security/customizing-the-notarization-workflow)
