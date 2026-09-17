# Lifeboat

**Turn issue exports into an offline app you own.**

Lifeboat imports GitHub, Jira, Trello, or CSV data, lets you describe workflows to
GPT-6 Astra, and packages an independent local application after you review and
accept its behavior.

**AI designs the workflow. Your app runs it locally.** No Studio process, AI key,
or external internet connection is required by a downloaded Player.

[Download the Astra preview](https://github.com/agent-axiom/lifeboat/releases/tag/v0.1.0-astra-preview)

## Try it

1. Download **lifeboat-harbor-cli-astra-macos-arm64.zip** for a ready-to-run demonstration without an API key, or **lifeboat-studio-macos-arm64.zip** to import your own data and design workflows.
2. Extract the whole ZIP into a writable folder on a macOS Apple Silicon computer.
3. Start the included `.command` launcher and open the local URL shown in its terminal.
4. Keep the terminal open while using the app. Changes stay in its local SQLite database.

This preview is unsigned and not notarized; macOS may block execution. Prebuilt
Windows, Linux, and Intel Mac packages are not provided. Source is included in the
release assets; ordinary use of the prebuilt Player needs no Go installation.

## From your data to your app

1. **Import** a snapshot and inspect supported fields and raw-only limitations.
2. **Inspect the context** that would be shared with Astra. Import alone does not send it to the model.
3. **Describe a workflow** using your OpenAI API key through the UI or a local `.env` file.
4. **Review the contract**, including guards, action steps, and declared limitations.
5. **Try the isolated preview**, then accept the exact contract and download the app.
6. **Keep working locally** with original/current exports, backups, and optional read-only MCP.

The no-AI path uses a fixed, labeled sample action. It does not interpret workflow
requests. AI requests require model access and may incur API charges.

## Demonstrated with a real Astra-generated workflow

The fictional Harbor CLI GitHub-format example contains a closed bug and a
regression report. `Reopen for triage` adds `priority` and moves the item to `Open`
without changing its description, comment, or original source export.

The accepted demo was downloaded, launched without Studio or API keys with
external outbound network access denied to Player, and exercised through a process
restart. The action worked, state persisted, and the original export checksum
remained unchanged. This is a synthetic demonstration, not a customer case study.

## Honest boundaries

- Snapshot imports only: no live synchronization or writeback to source services.
- Unsupported fields may be read-only or raw-only. Review the preservation report.
- The original export and the editable working copy are distinct.
- MCP exposes read-only search/item/action-definition tools, not write access.
- Source is included for transparency; this preview does not assert an open-source license.
- The Studio ZIP packages previously used binaries with a new launcher; a separate clean-machine walkthrough remains pending.

Built with GPT-6 Astra for the Product Hunt Astra Challenge.
