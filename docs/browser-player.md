# Browser Player preview

The browser Player is a separate, self-contained execution path. It does not
replace the native Studio or claim to generate new workflows with Astra.

## User path

1. Open the Player, import a UTF-8 snapshot, or use the explicitly fictional sample.
2. Inspect normalized items and the import limitations. The original source
   remains separate and can be downloaded without working-copy changes.
3. Review the two-step recipe and selected-item preview, then accept it.
4. Run the action. Archived items are refused; repeated matching actions are no-ops.
5. Download a JSON backup or a self-contained HTML workspace. The HTML contains
   all runtime code and data, with no external assets or API dependency.
6. Open the downloaded HTML in a browser. Review the embedded workflow again
   before running actions. Download a new copy after subsequent edits.

## Supported inputs

- GitHub REST issue arrays, `{issues: [...]}`, and search `{items: [...]}`.
  Arrays of pages such as a GitHub CLI slurp export are also accepted. Pull
  requests are omitted from the working view but retained in the original.
- Jira issue-search JSON with `issues[].fields.summary`, status, description,
  and labels. Rich-text descriptions are projected as plain text.
- Trello board JSON with `cards` and `lists`. Closed cards, lists, or boards
  produce archived working items. Original list names become local statuses.
- Comma-separated UTF-8 CSV with a `title`, `summary`, or `name` column.
  Optional columns: `id`/`key`/`issue key`/`number`, `description`/`body`,
  `status`/`state`/`list`, `labels`, and `archived`. CSV labels use semicolons
  or pipes. Quoted commas, escaped quotes, and multiline fields are supported.
- This Player's own `lifeboat.browser-player.v1` JSON backups.

The preview caps raw source files at 5 MB and 2,000 items; JSON backup uploads
are capped at 30 MB. Duplicate IDs and malformed fields fail rather than being
silently merged. No extra pages, comments, images, or attachments are fetched.
An accepted subset is not evidence of a complete source-system backup.

## Workflow and provenance

The default browser recipe reproduces the two-step behavior of the previously
accepted native Astra example: add `priority`, then set status to `Open`, with
an archive guard. It is a browser adapter of that behavior, not the native
contract file or a newly generated Astra result. Users can manually configure
the action name, label, and target status. Changes invalidate acceptance.

The browser contract schema is intentionally bounded to `add_label` followed
by `set_status`, guarded by `not_archived`. Imported recipes cannot execute
arbitrary JavaScript. Acceptance records and the last 200 activity entries
are editable local metadata, not signed identity or cryptographic provenance.

## Privacy and persistence

The page includes a Content Security Policy with `connect-src 'none'`, no
remote scripts, fonts, analytics, or model calls. Imported content is rendered
as text, not HTML. Embedded JSON escapes `<` before inclusion in HTML. Source
checksums use Web Crypto when available; unavailable checksums are disclosed.

Browser backup is opt-in and stores one latest workspace in localStorage.
Storage can fail or be cleared, and backups are not encrypted. A downloaded
HTML or JSON file includes the original export in plain text. Do not publish
private exports or share those files unintentionally.

The HTML does not automatically overwrite its file when the user edits items.
Users must download a new copy. New imports and reopened files require explicit
review even if an imported acceptance record exists. No source tracker is
updated by any Player action. Native macOS signing remains a separate blocker.

## Validation status

Implementation is a new preview. No new automated or end-to-end results are
claimed by this document. Required checks include the import formats, rejected
malformed inputs, acceptance invalidation, action idempotency, archive refusal,
original preservation, backup restore, storage failure, downloaded-file startup,
offline execution, mobile layout, and text-only handling of hostile import data.

## Format references

- [GitHub issue REST responses](https://docs.github.com/en/rest/issues/issues#list-repository-issues)
- [Jira issue-search responses](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/)
- [Trello object definitions](https://developer.atlassian.com/cloud/trello/guides/rest-api/object-definitions/)
