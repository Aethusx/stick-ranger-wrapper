# Stick Ranger Wrapper

Simple stick ranger wrapper made in Electron

# Features

- Saving into text file
- Loading from text file
- Autosave
- Keeping save backups (50 by default)
- Fullscreen (press CTRL+F)
- Option to change image renderer
- Discord RPC
- Cheats
  - Get book from all discovered maps

# Usage

Put `Stick Ranger.js` and `data\` into `resources\app\` (or `stick-ranger.app\Contents\Resources\app`` on macOS) folder and run executable

# Screenshots

![Screenshot 1](/screenshots/1.png?raw=true)

# How to integrate with mods

Just replace Stick Ranger.js, if you want to use custom index.html you need to load electron-integration.js
`<script src="electron-integration.js"></script>`
