#!/bin/bash
#
# TypeScript Error Validation Hook
# Checks for TypeScript compilation errors after tool use
# Blocks agent from stopping if errors are present
#
# Input: JSON with toolName, exitCode, output
# Output: JSON with decision (block | continue) and systemMessage

set -e

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Extract relevant data from hook input
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.toolName // "unknown"')
TOOL_EXIT_CODE=$(echo "$HOOK_INPUT" | jq -r '.exitCode // 0')
TOOL_OUTPUT=$(echo "$HOOK_INPUT" | jq -r '.output // ""')

# Check if TypeScript compiler is available
if ! command -v tsc &> /dev/null; then
  echo "{}"
  exit 0
fi

# Run TypeScript type checking
# tsc --noEmit performs type checking without emitting output
TS_CHECK_OUTPUT=$(tsc --noEmit 2>&1 || true)
TS_CHECK_EXIT=$?

# Count the number of errors
ERROR_COUNT=$(echo "$TS_CHECK_OUTPUT" | grep -c "error TS" || true)

# Prepare response
if [ "$ERROR_COUNT" -gt 0 ]; then
  # Build detailed error message
  ERROR_SUMMARY=$(echo "$TS_CHECK_OUTPUT" | head -10)
  TOTAL_ERRORS="$ERROR_COUNT errors found"
  
  if [ "$ERROR_COUNT" -gt 10 ]; then
    TOTAL_ERRORS="$ERROR_COUNT errors found (showing first 10)"
  fi

  # Return blocking decision with system message
  cat << EOF
{
  "decision": "block",
  "systemMessage": "❌ TypeScript compilation errors detected. The agent cannot proceed until these are fixed.\n\n$TOTAL_ERRORS\n\nSample errors:\n\`\`\`\n$ERROR_SUMMARY\n\`\`\`\n\nPlease fix these errors before continuing.",
  "hookSpecificOutput": {
    "errorCount": $ERROR_COUNT,
    "errorDetails": $(echo "$TS_CHECK_OUTPUT" | jq -Rs '.')
  }
}
EOF
  exit 0
else
  # No errors, continue normally
  echo "{}"
  exit 0
fi
