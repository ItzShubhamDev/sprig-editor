# Spring Editor

A [Sprig Editor](https://sprig.hackclub.com) with some extra features like autocomplete, Image to Sprite Generator, and more to be added in future.

#### AI was used in generation of documentation of Engine API functions, which could be wrong, please let me know if the description or function arguments itself are wrong.

## Demo

https://sprig-editor.vercel.app/

## Screenshots

![Screenshot](https://raw.githubusercontent.com/ItzShubhamDev/sprig-editor/refs/heads/main/src/assets/screenshot.png)

## Prerequisites

Node.js >= 20

## Installation

Clone the repo, install the dependencies, and run

```bash
git clone https://github.com/ItzShubhamDev/sprig-editor.git
cd sprig-editor
npm install
npm run dev
```

## Acknowledgements

-   [Hackclub Sprig](https://github.com/hackclub/sprig/) - The Game running function from dynamic code is copied from this, because I always failed in doing so.
-   [Sprig-PNG-To-Bitmap-Converter](https://github.com/Chenzo46/Sprig-PNG-To-Bitmap-Converter) - The Image to Sprite logic is somewhat inspired from this.

## Features

-   Autocomplete
-   Image to Sprite
-   Functions Arguments

## Best Practises for Sprite Generations

Make sure the image size is as much small as possible min. **16x16** to get the best results. The colors also play an important role in the sprite generation, colors much closer to Sprig's color sets will produce the best result.
