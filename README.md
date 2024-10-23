[![Node.js CI](https://github.com/ikruchynskyi/payment-services-helper/actions/workflows/node.yml/badge.svg?branch=react)](https://github.com/ikruchynskyi/payment-services-helper/actions/workflows/node.yml)

# payment-services-helper

## Purpose
Extension loads usefull information which is associated with Payment Services into the browser's console
![browser console](https://raw.githubusercontent.com/ikruchynskyi/payment-services-helper/main/misc/console_example_1.png)

## How to use
- Download project as a ZIP archive
![download zip](https://raw.githubusercontent.com/ikruchynskyi/payment-services-helper/main/misc/download_zip.png)

To load an unpacked extension in developer mode:
- Go to the Extensions page by entering chrome://extensions in a new tab. (By design chrome:// URLs are not linkable.) Alternatively, click the Extensions menu puzzle button and select Manage Extensions at the bottom of the menu.
- Enable Developer Mode by clicking the toggle switch next to Developer mode.
- Click the Load unpacked button and select the extension directory.
![Example](https://developer.chrome.com/static/docs/extensions/get-started/tutorial/hello-world/image/extensions-page-e0d64d89a6acf.png)
Ta-da! The extension has been successfully installed. If no extension icons were included in the manifest, a generic icon will be created for the extension.

## CLI installation

```bash
curl -Ls -O https://github.com/ikruchynskyi/payment-services-helper/archive/main.zip \
&& unzip main.zip && cd payment-services-helper-main \
&& echo "Extensaion downloaded and unarchived. Path:" \
&& pwd
```
Then load unpacked folder as described in previous step.

## Pin extension to the toolbar:
![pin_extension](https://raw.githubusercontent.com/ikruchynskyi/payment-services-helper/main/misc/pin.png)
