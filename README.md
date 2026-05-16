# Volume Booster

A single Manifest V3 browser extension that boosts audio and video elements up to 600%, including YouTube.

## Features

- Boost page audio/video from 100% to 600%
- Popup toggle to enable or disable boosting
- Quick preset buttons for common boost levels
- Reset control to return to the default 100% volume
- Local settings storage only

## Chrome Install

Download `volume-booster-extension.zip` from the project release page, unzip it, then load the unpacked extension:

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the unzipped `extension` folder

## Firefox Install

<!-- Firefox Add-ons link: **TODO: add AMO listing URL** -->

Download `volume-booster-extension.zip` from the project release page, unzip it, then load the unpacked extension:

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on...**.
3. Select `extension/manifest.json`.

## Use

Open the extension popup on a playing tab, turn boosting on, and move the slider above 100%. If the page was already open before installing the extension, refresh the tab once so the content script can attach to the video player.

## Privacy

Volume Booster does not collect, transmit, sell, or share user data. Settings are stored locally in browser extension storage. There are no analytics, tracking scripts, external API calls, or remote code execution.

## Packaging

Run:

```bash
./generate-extension-pack-zip.sh
```

This creates `volume-booster-extension.zip` from the files in `extension/`.

## Author

[@gaurav7902](https://github.com/gaurav7902)

## License

[MIT License](LICENSE)
