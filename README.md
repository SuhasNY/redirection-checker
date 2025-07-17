# Redirection Checker

A browser extension for Chromium-based browsers to check the safety of redirections triggered.

## Overview

**Redirection Checker** helps users identify and analyze URL redirections in real-time as they browse, providing insights about where links or navigation attempts may take them. This enhances user security by flagging suspicious or potentially unsafe redirections.

## Features

- Detects and displays all redirections triggered during browsing
- Provides details about each redirection step (source, destination, HTTP codes, etc.)
- Warns users of potentially unsafe or suspicious redirects
- Simple and intuitive UI
- Lightweight and fast

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SuhasNY/redirection-checker.git
   ```
2. **Load the extension in Chrome/Edge:**
   - Open your browser and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click on "Load unpacked"
   - Select the cloned `redirection-checker` folder

## Usage

- After installation, click on the extension icon in your browser toolbar.
- Start browsing as usual. The extension will monitor redirects and display information when they occur.
- Review the details of each redirection directly in the extension popup or options page.

## Development

This extension is built using:

- **JavaScript** (core logic and background scripts)
- **CSS** (styling UI components)
- **HTML** (extension popup and options pages)

### Folder Structure

```
redirection-checker/
├── background.js
├── popup.html
├── popup.js
├── options.html
├── options.js
├── styles/
│   └── popup.css
├── manifest.json
└── README.md
```

### Build & Contribute

No build step required! To contribute:

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -am 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License.

## Author

- [SuhasNY](https://github.com/SuhasNY)

---

Feel free to open issues or contribute to improve the extension!
