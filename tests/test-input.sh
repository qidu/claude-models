#!/bin/bash
cd claude-models
echo "Testing claude-models module..."
echo ""

# Test 1: Run simple-tui.js with complete inputs
echo "=== Test 1: Simple TUI ==="
cat <<EOF | node simple-tui.js
../claude-models.txt
1
1
1

y
EOF

echo ""
echo "=== Test 2: Demo ==="
node demo.js

echo ""
echo "=== Test 3: Parsing Test ==="
node test.js