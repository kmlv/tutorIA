#!/usr/bin/env bash
# Thin wrapper so agents can post with ./coord-msg.sh as the protocol tells them to.
#
# Why this exists: coord/AGENTS_PROTOCOL.md instructs agents to post via the MCP
# `coord_post` tool OR `./coord-msg.sh`. The MCP tool permission-bounces in headless
# wakes, and the real script lives in the kit, not in the repo — so agents had no
# working writer and their posts were lost silently while they believed they had
# succeeded. Found by fable in T-010.
exec "${COORD_KIT:-$HOME/.aistigmergy/kit}/coord-msg.sh" "$@"
