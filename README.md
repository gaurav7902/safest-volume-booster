# Volume Booster

A single Manifest V3 browser extension that boosts audio and video elements up to 600%, including YouTube.

## Quick Navigation

- [Features](#features)
- [Quick install](#quick-install)
- [Use](#use)
- [Privacy](#privacy)
- [Packaging](#packaging)
- [Author](#author)
- [License](#license)

## Features

- Boost page audio/video from 100% to 600%
- Popup toggle to enable or disable boosting
- Quick preset buttons for common boost levels
- Reset control to return to the default 100% volume
- Local settings storage only

## Quick install

### Firefox Install

Available on addon store :)

Click Here 👉
[![Firefox](https://img.shields.io/badge/Firefox-Install-FF7139?logo=firefox&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/safest-volume-booster/)

### Microsoft Edge

Available on Microsoft Edge Add-ons

Click Here 👉
[![Edge](https://img.shields.io/badge/Edge-Install-0078D7?logo=microsoft-edge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/objjeliacgbldkachijminogkkdhceaf)

### Chrome / Brave

1. Download `codeforces-darktheme-extension.zip` from releases:  
   [Releases](https://github.com/gaurav7902/safest-volume-booster/releases/tag/v1.0.0) or directly: [Zip download](https://github.com/gaurav7902/safest-volume-booster/releases/download/v1.0.0/safest-volume-booster-extension.zip)
2. Unzip the file to a local folder.
3. Open your Chromium-based browser (Chrome, Brave) and go to `chrome://extensions/` or `brave://extensions/` as appropriate.
4. Enable "Developer mode" (top right).
5. Click "Load unpacked" and select `manifest.json` from the unzipped folder.

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
