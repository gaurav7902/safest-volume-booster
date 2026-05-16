#!/bin/bash

OUTPUT="extension.zip"

if [[ ! -d "extension" ]]; then
    echo "Error: extension folder not found."
    exit 1
fi

cd extension || exit 1

FILES=(
    "content.js"
    "icon48.png"
    "icon128.png"
    "manifest.json"
    "popup.css"
    "popup.html"
    "popup.js"
)

for file in "${FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "Error: $file does not exist."
        exit 1
    fi
done

rm -f "../$OUTPUT"
zip -r "../$OUTPUT" "${FILES[@]}"

echo "Created $OUTPUT with direct extension files."
