#!/usr/bin/env bash
set -euo pipefail

# Symlink-aware kit dir so coord-lib.sh resolves through a ~/.local/bin symlink.
src="${BASH_SOURCE[0]}"
while [ -L "$src" ]; do
  dir="$(cd -P "$(dirname "$src")" && pwd)"
  src="$(readlink "$src")"
  [ "${src#/}" = "$src" ] && src="$dir/$src"
done
kit="$(cd -P "$(dirname "$src")" && pwd)"
# shellcheck source=coord-lib.sh
. "$kit/coord-lib.sh"

usage() {
  cat <<'USAGE'
Usage:
  coord-msg.sh /path/to/project --from AGENT --type TYPE [options]

Appends a protocol message to a coordination thread with automatic UTC
timestamp, automatic thread_rev_seen/thread_rev, and an atomic lock so two
agents cannot interleave writes. This replaces manual frontmatter-block
counting.

Options:
  --from AGENT     sender (required)
  --type TYPE      claim|proposal|review|review-request|ack|status|decision|
                   dissent|handoff|iteration-start|iteration-check|
                   iteration-stop|stale-ping|protocol-gap|reconcile|
                   protocol-test (required)
  --to LIST        recipients, comma-separated
                   use @reviewers with type review-request to address the
                   active Reviewers: route roster
                   (default: Agents from STATE.md minus sender)
  --task ID        task id (default: active task in STATE.md)
  --thread PATH    thread file relative to project
                   (default: active thread in STATE.md)
  --lead AGENT     lead field (optional)
  --files LIST     comma-separated files_owned (optional)
  --tldr TEXT      TL;DR line (required)
  --body TEXT      body text; use "--body -" to read the body from stdin
  --ack            set ack: true (default: false)
  --op-id ID       internal/recovery: reuse an existing journal op id
  --atomic         opt-in: stage the thread append in a temp file, then rename

Examples:
  coord-msg.sh . --from claude --type status --tldr "Edited slide 3; tests pass."
  git diff --stat | coord-msg.sh . --from codex --type review \
    --tldr "[suggestion] simplify loop; no blockers." --body -
USAGE
}

coord_msg_valid_to() {
  local list compact part trimmed
  local -a coord_msg_to_parts
  list="${1:-}"
  coord_valid_scalar "$list" || return 1
  [[ "$list" == "all" ]] && return 0
  [[ -n "$list" ]] || return 1
  compact="$(printf '%s' "$list" | tr -d '[:space:]')"
  case "$compact" in
    ","*|*","|*",,"*) return 1 ;;
  esac
  IFS=',' read -ra coord_msg_to_parts <<< "$list"
  for part in "${coord_msg_to_parts[@]}"; do
    trimmed="$(printf '%s' "$part" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    coord_valid_name "$trimmed" || return 1
  done
}

coord_msg_trim() {
  printf '%s' "${1:-}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

coord_msg_csv_contains() {
  local csv name part
  local -a coord_msg_csv_parts
  csv="${1:-}"
  name="${2:-}"
  [[ -n "$csv" && -n "$name" ]] || return 1
  IFS=',' read -ra coord_msg_csv_parts <<< "$csv"
  for part in "${coord_msg_csv_parts[@]}"; do
    [[ "$part" == "$name" ]] && return 0
  done
  return 1
}

coord_msg_names_csv() {
  local list part trimmed out
  local -a coord_msg_name_parts
  list="${1:-}"
  coord_valid_scalar "$list" || return 1
  [[ -n "$(coord_msg_trim "$list")" ]] || return 1
  IFS=',' read -ra coord_msg_name_parts <<< "$list"
  out=""
  for part in "${coord_msg_name_parts[@]}"; do
    trimmed="$(coord_msg_trim "$part")"
    coord_valid_name "$trimmed" || return 1
    if coord_msg_csv_contains "$out" "$trimmed"; then
      return 1
    fi
    out="${out:+$out,}$trimmed"
  done
  [[ -n "$out" ]] || return 1
  printf '%s\n' "$out"
}

coord_msg_csv_without_name() {
  local csv skip part out
  local -a coord_msg_csv_parts
  csv="${1:-}"
  skip="${2:-}"
  out=""
  IFS=',' read -ra coord_msg_csv_parts <<< "$csv"
  for part in "${coord_msg_csv_parts[@]}"; do
    [[ -z "$part" || "$part" == "$skip" ]] && continue
    out="${out:+$out,}$part"
  done
  printf '%s\n' "$out"
}

coord_msg_state_field_safe() {
  coord_state_field "$1" "$2" 2>/dev/null || true
}

coord_msg_state_has_field() {
  grep -qE "^- $2:" "$1" 2>/dev/null
}

coord_msg_reviewers_from_state() {
  local state_file sender reviewers lead agents_line agents fallback
  state_file="$1"
  sender="$2"
  if coord_msg_state_has_field "$state_file" "Reviewers"; then
    reviewers="$(coord_msg_trim "$(coord_msg_state_field_safe "$state_file" "Reviewers")")"
    if [[ -n "$reviewers" && "$reviewers" != "none" ]]; then
      coord_msg_names_csv "$reviewers"
      return $?
    fi
    return 1
  fi

  # Legacy active tasks missing E3 route fields are assumed full-mesh so review
  # cannot silently weaken just because older state lacks Reviewers:.
  lead="$(coord_msg_trim "$(coord_msg_state_field_safe "$state_file" "Lead")")"
  [[ -z "$lead" || "$lead" == "none" ]] && lead="$sender"
  agents_line="$(grep -E '^Agents:' "$state_file" | head -1 | sed 's/^Agents:[[:space:]]*//' || true)"
  if ! agents="$(coord_msg_names_csv "$agents_line")"; then
    return 1
  fi
  fallback="$(coord_msg_csv_without_name "$agents" "$lead")"
  [[ -n "$fallback" ]] || return 1
  printf '%s\n' "$fallback"
}

coord_msg_valid_task_ref() {
  local value
  value="${1:-}"
  coord_valid_scalar "$value" || return 1
  [[ "$value" == "none" ]] && return 0
  coord_valid_task_id "$value"
}

coord_msg_validate_dissent_body() {
  local body
  body="${1:-}"
  [[ -n "$body" ]] || return 1
  printf '%s\n' "$body" | awk '
    function trim(s) {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", s)
      return s
    }
    BEGIN {
      valid_severity["blocker"] = 1
      valid_severity["suggestion"] = 1
      valid_severity["nit"] = 1
      valid_category["correctness"] = 1
      valid_category["coordination"] = 1
      valid_category["security"] = 1
      valid_category["operability"] = 1
      valid_category["test-gap"] = 1
      valid_category["scope"] = 1
      valid_category["docs"] = 1
      valid_category["cost"] = 1
      valid_request["accept"] = 1
      valid_request["reject-with-rationale"] = 1
      valid_request["escalate-to-principal"] = 1
      valid_request["open-council"] = 1
    }
    tolower($0) ~ /^dissent:[[:space:]]*$/ { header = 1; next }
    /^[[:space:]]*-[[:space:]]*[^:]+:/ {
      line = $0
      key = line
      sub(/^[[:space:]]*-[[:space:]]*/, "", key)
      sub(/:.*/, "", key)
      key = tolower(trim(key))
      value = line
      sub(/^[[:space:]]*-[[:space:]]*[^:]+:[[:space:]]*/, "", value)
      value = trim(value)
      field[key] = value
    }
    END {
      split("severity category against claim evidence requested resolution proposed next step", required, " ")
      # The two multi-word fields are checked explicitly below; the split keeps
      # the simple keys readable without relying on non-portable awk arrays.
      if (!header) exit 1
      if (field["severity"] == "" || field["category"] == "" ||
          field["against"] == "" || field["claim"] == "" ||
          field["evidence"] == "" || field["requested resolution"] == "" ||
          field["proposed next step"] == "") exit 1
      if (!(tolower(field["severity"]) in valid_severity)) exit 1
      if (!(tolower(field["category"]) in valid_category)) exit 1
      if (!(tolower(field["requested resolution"]) in valid_request)) exit 1
      exit 0
    }
  '
}

if [[ $# -lt 1 ]]; then
  usage
  exit 2
fi

# Allow -h/--help as the first argument before the positional target is consumed.
case "${1:-}" in -h | --help)
  usage
  exit 0
  ;;
esac

target="$1"
shift

from=""
to=""
type=""
task=""
thread=""
lead=""
files=""
tldr=""
body=""
ack="false"
op_id=""
atomic="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from) from="${2:?missing value for --from}"; shift 2 ;;
    --to) to="${2:?missing value for --to}"; shift 2 ;;
    --type) type="${2:?missing value for --type}"; shift 2 ;;
    --task) task="${2:?missing value for --task}"; shift 2 ;;
    --thread) thread="${2:?missing value for --thread}"; shift 2 ;;
    --lead) lead="${2:?missing value for --lead}"; shift 2 ;;
    --files) files="${2:?missing value for --files}"; shift 2 ;;
    --tldr) tldr="${2:?missing value for --tldr}"; shift 2 ;;
    --body) body="${2:?missing value for --body}"; shift 2 ;;
    --ack) ack="true"; shift ;;
    --op-id) op_id="${2:?missing value for --op-id}"; shift 2 ;;
    --atomic) atomic="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

state="$target/coord/STATE.md"

if [[ ! -f "$state" ]]; then
  echo "Missing coord/STATE.md in $target. Run bootstrap.sh first." >&2
  exit 1
fi

[[ -z "$from" ]] && { echo "--from is required" >&2; exit 2; }
[[ -z "$tldr" ]] && { echo "--tldr is required" >&2; exit 2; }

# --tldr is written verbatim into the message (TL;DR: line) — validate it like
# --op-id so a newline/control char cannot forge a frontmatter block above the
# real body (Fable 5 retro, I-15 seam).
if ! coord_valid_scalar "$tldr"; then
  echo "Invalid --tldr: must be a single-line scalar." >&2
  exit 2
fi

if ! coord_valid_name "$from"; then
  echo "Invalid --from: safe agent name required." >&2
  exit 2
fi

case "$type" in
  claim|proposal|review|review-request|ack|status|decision|dissent|handoff|iteration-start|iteration-check|iteration-stop|stale-ping|protocol-gap|reconcile|protocol-test) ;;
  *) echo "Invalid --type: $type" >&2; usage; exit 2 ;;
esac

# Validate + canonicalize --files (codex T-053): same guard as coord-start-task.sh
# so a claim cannot poison files_owned frontmatter with traversal/metachar paths.
if [[ -n "$files" ]]; then
  if ! files="$(coord_fileset_csv "$files")"; then
    echo "Invalid --files: comma-separated repo-relative paths/globs only (no ../, whitespace, or shell metacharacters)." >&2
    exit 2
  fi
fi

if [[ -z "$thread" ]]; then
  thread="$(coord_state_field "$state" "Active thread")"
  if [[ -z "$thread" || "$thread" == "none" ]]; then
    echo "No active thread in STATE.md; pass --thread explicitly." >&2
    exit 1
  fi
fi
if ! coord_valid_thread_rel "$thread"; then
  echo "Invalid thread path: $thread" >&2
  echo "Thread paths must be relative coord/threads/<safe>.md paths." >&2
  exit 2
fi
thread_path="$target/$thread"
if [[ ! -f "$thread_path" ]]; then
  echo "Thread not found: $thread_path" >&2
  exit 1
fi

if [[ -z "$task" ]]; then
  task="$(coord_state_field "$state" "Task" | awk '{print $1}')"
  [[ -z "$task" ]] && task="none"
fi
if ! coord_msg_valid_task_ref "$task"; then
  echo "Invalid --task: expected T-NNN or none." >&2
  exit 2
fi

if [[ -z "$to" ]]; then
  agents_line="$(grep -E '^Agents:' "$state" | head -1 | sed 's/^Agents:[[:space:]]*//')"
  if [[ -n "$agents_line" ]]; then
    IFS=',' read -ra arr <<< "$agents_line"
    for a in "${arr[@]}"; do
      trimmed="$(echo "$a" | tr -d '[:space:]')"
      [[ -z "$trimmed" || "$trimmed" == "$from" ]] && continue
      to+="$trimmed,"
    done
    to="${to%,}"
  fi
  [[ -z "$to" ]] && to="all"
fi
to="$(coord_msg_trim "$to")"
if [[ "$to" == "@reviewers" ]]; then
  if [[ "$type" != "review-request" ]]; then
    echo "Invalid --to @reviewers: only type review-request may use the active review route roster." >&2
    exit 2
  fi
  if ! to="$(coord_msg_reviewers_from_state "$state" "$from")"; then
    echo "Invalid --to @reviewers: no Reviewers route roster is available." >&2
    exit 2
  fi
fi
if ! coord_msg_valid_to "$to"; then
  echo "Invalid --to: expected all or a comma-separated list of safe agent names." >&2
  exit 2
fi

if [[ -n "$lead" ]] && ! coord_valid_name "$lead"; then
  echo "Invalid --lead: safe agent name required." >&2
  exit 2
fi

if [[ "$body" == "-" ]]; then
  body="$(cat)"
fi

if [[ "$type" == "dissent" ]]; then
  if ! coord_msg_validate_dissent_body "$body"; then
    echo "Invalid dissent body: expected a Dissent block with severity/category/against/claim/evidence/requested resolution/proposed next step." >&2
    exit 2
  fi
fi

# Writer-side guard (belt-and-suspenders). The read-side parser in coord-lib.sh
# treats a bare `---` as a frontmatter delimiter ONLY when the previous line is
# blank/BOF AND the next line is `from:`. The one residual ambiguity is a body
# that itself pastes `---` immediately followed by a `from:` line — structurally
# identical to real frontmatter. Neutralize it here with a minimal, markdown-safe
# rewrite: indent the bare `---` to four spaces (an indented code line — no longer
# a horizontal rule, no longer a YAML delimiter, and no longer matching the
# delimiter regex) whenever the next body line begins with `from:`. The visible
# content is preserved. Do not hand-paste frontmatter into bodies; use this tool.
if [[ -n "$body" ]]; then
  body="$(printf '%s\n' "$body" | awk '
    {
      if (prevsep && $0 ~ /^from:/) { sub(/^---/, "    ---", buf[NR-1]) }
      buf[NR] = $0
      prevsep = ($0 ~ /^---[[:space:]]*$/)
    }
    END { for (i = 1; i <= NR; i++) print buf[i] }
  ')"
fi

# Atomic lock (mkdir is atomic on POSIX filesystems; portable to macOS). The
# lock records the holder PID so a lock left by a killed writer (SIGKILL/OOM,
# where the EXIT trap never fires) is reclaimed instead of wedging the thread.
lockdir="$thread_path.lock"
acquired="false"
i=0
while [[ $i -lt 50 ]]; do
  if mkdir "$lockdir" 2>/dev/null; then
    printf '%s\n' "$$" > "$lockdir/pid"
    acquired="true"
    break
  fi
  # Reclaim a stale lock whose owner process is gone (e.g. killed mid-write).
  # Rename-then-remove so concurrent reclaimers cannot delete a lock that a
  # different writer has just re-created: only one waiter wins the atomic mv.
  oldpid="$(cat "$lockdir/pid" 2>/dev/null || true)"
  if [[ -n "$oldpid" ]] && ! kill -0 "$oldpid" 2>/dev/null; then
    if mv "$lockdir" "$lockdir.stale.$$" 2>/dev/null; then
      rm -rf "$lockdir.stale.$$"
    fi
    continue
  fi
  sleep 0.1
  i=$((i + 1))
done
if [[ "$acquired" != "true" ]]; then
  echo "Could not lock thread (held by another writer?): $lockdir" >&2
  exit 1
fi
trap 'rm -rf "$lockdir" 2>/dev/null || true' EXIT

# thread_rev_seen = count of complete frontmatter blocks already in the file.
# Uses the robust block model (coord-lib.sh) so a body `---` cannot inflate it.
rev_seen="$(coord_block_count "$thread_path")"
rev_next=$((rev_seen + 1))
ts_utc="$(date -u +%FT%TZ)"
signature="$(printf '%s' "$from" | awk '{ print toupper(substr($0, 1, 1)) substr($0, 2) }')"
if [[ -z "$op_id" ]]; then
  op_id="$(coord_journal_op_id "message.append" "$task" "$thread|$rev_next|$from|$type|$tldr|$body")"
fi
# A user-supplied --op-id is written verbatim into frontmatter (op_id:) — validate
# it so a newline/control char cannot inject additional keys (agy I-15 review).
if ! coord_valid_scalar "$op_id"; then
  echo "Invalid --op-id: must be a single-line scalar." >&2
  exit 2
fi

# Skip our trailing signature if the body already self-signs with the sender,
# otherwise a body ending in `- claude` would get a second `- Claude` line
# (the doubled-signature bug). We compare the body's last non-blank line against
# `^- *<sender>$` case-insensitively, so any casing/spacing of the sender's own
# sign-off (e.g. `- claude`, `-  Claude`) suppresses the appended one. A body
# that does not self-sign (and an empty body) still gets exactly one signature.
append_signature="true"
if [[ -n "$body" ]]; then
  last_body_line="$(printf '%s\n' "$body" | awk 'NF { last = $0 } END { print last }')"
  # Literal, case-insensitive compare of the sign-off word to the sender (no
  # regex injection from $from). Matches any spacing, e.g. "- claude", "-  Claude".
  if [[ "$last_body_line" =~ ^-[[:space:]]*([A-Za-z0-9._-]+)[[:space:]]*$ ]]; then
    sig_word="$(printf '%s' "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')"
    [[ "$sig_word" == "$(printf '%s' "$from" | tr '[:upper:]' '[:lower:]')" ]] && append_signature="false"
  fi
fi

payload="$(
  printf '{'
  printf '"from":%s,' "$(printf '%s' "$from" | coord_json_escape)"
  printf '"to":%s,' "$(printf '%s' "$to" | coord_json_escape)"
  printf '"type":%s,' "$(printf '%s' "$type" | coord_json_escape)"
  printf '"task":%s,' "$(printf '%s' "$task" | coord_json_escape)"
  printf '"thread":%s,' "$(printf '%s' "$thread" | coord_json_escape)"
  printf '"lead":%s,' "$(printf '%s' "$lead" | coord_json_escape)"
  printf '"files":%s,' "$(printf '%s' "$files" | coord_json_escape)"
  printf '"tldr":%s,' "$(printf '%s' "$tldr" | coord_json_escape)"
  printf '"body":%s,' "$(printf '%s' "$body" | coord_json_escape)"
  printf '"ack":%s,' "$ack"
  printf '"atomic":%s,' "$atomic"
  printf '"rev_seen":%s,' "$rev_seen"
  printf '"rev_next":%s' "$rev_next"
  printf '}'
)"
coord_journal_begin "$target" "$task" "$op_id" "message.append" "$payload"

message_tmp=""
if coord_thread_has_op "$thread_path" "$op_id"; then
  appended="false"
else
  appended="true"
  if [[ "$atomic" == "true" ]]; then
    message_tmp="$(mktemp "$thread_path.tmp.XXXXXX")"
    cat "$thread_path" > "$message_tmp"
    message_out="$message_tmp"
  else
    message_out="$thread_path"
  fi
  {
  printf '\n---\n'
  printf 'from: %s\n' "$from"
  printf 'to: %s\n' "$to"
  printf 'ts_utc: %s\n' "$ts_utc"
  printf 'type: %s\n' "$type"
  printf 'ack: %s\n' "$ack"
  printf 'task: %s\n' "$task"
  printf 'op_id: %s\n' "$op_id"
  [[ -n "$lead" ]] && printf 'lead: %s\n' "$lead"
  printf 'thread_rev_seen: %s\n' "$rev_seen"
  printf 'thread_rev: %s\n' "$rev_next"
  if [[ -n "$files" ]]; then
    printf 'files_owned:\n'
    IFS=',' read -ra farr <<< "$files"
    for f in "${farr[@]}"; do
      trimmed="$(echo "$f" | xargs)"
      [[ -z "$trimmed" ]] && continue
      printf '  - %s\n' "$trimmed"
    done
  fi
  printf -- '---\n\n'
  printf 'TL;DR: %s\n' "$tldr"
  if [[ -n "$body" ]]; then
    printf '\n%s\n' "$body"
  fi
  [[ "$append_signature" == "true" ]] && printf '\n- %s\n' "$signature"
  } >> "$message_out"
  if [[ "$atomic" == "true" ]]; then
    mv "$message_tmp" "$thread_path"
    message_tmp=""
  fi
fi
rm -f "$message_tmp" 2>/dev/null || true

trace_file="$target/coord/trace.jsonl"
trace_id="$(printf '%s' "$task" | shasum 2>/dev/null | cut -d' ' -f1 || echo "0000")"
span_id="$(uuidgen 2>/dev/null | tr -d '-' | cut -c1-16 || date +%s%N | shasum 2>/dev/null | cut -c1-16)"
# coord_json_escape reads STDIN and emits a value ALREADY wrapped in quotes, so
# pipe each field in and do NOT add surrounding quotes. (The previous
# `\"$(coord_json_escape "$x")\"` form passed the value as an ignored arg, read
# empty stdin, and double-quoted it -> invalid `""""` JSON.)
from_j="$(printf '%s' "$from" | coord_json_escape)"
type_j="$(printf '%s' "$type" | coord_json_escape)"
task_j="$(printf '%s' "$task" | coord_json_escape)"
thread_j="$(printf '%s' "$thread" | coord_json_escape)"
op_id_j="$(printf '%s' "$op_id" | coord_json_escape)"
trace_payload="{\"timestamp\":\"$ts_utc\",\"trace.id\":\"$trace_id\",\"span.id\":\"$span_id\",\"event.name\":\"gen_ai.coordination.message\",\"gen_ai.system\":\"coord\",\"gen_ai.agent.name\":$from_j,\"gen_ai.operation.name\":$type_j,\"coord.task\":$task_j,\"coord.thread\":$thread_j,\"coord.op_id\":$op_id_j,\"coord.rev_seen\":$rev_seen,\"coord.rev_next\":$rev_next}"
# Best-effort sidecar: a trace-write failure must NEVER mask an already-committed
# thread post (the post above succeeded; with set -e an unguarded failure here
# would drop the success echo and return non-zero to coord_post/coord-pulse).
if [[ "$appended" == "true" ]]; then
  coord_trace_append "$trace_file" "$trace_payload"
fi
coord_journal_commit "$target" "$task" "$op_id" "message.append" "$payload"

if [[ "$appended" == "true" ]]; then
  echo "Appended $type message (rev $rev_seen -> $rev_next) to $thread"
else
  echo "Op $op_id already present in $thread; marked committed"
fi
