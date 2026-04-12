# Pi Agent Theme Designer

A web application for designing and exporting theme JSON files following the pi-mono specification.

## Features

- **51 Color Tokens**: Full support for all tokens from pi-mono specification
- **Variables (Vars)**: Top-level group for managing theme variables with add/remove (persists when empty); color references resolve to actual hex values (e.g., "accent" → "#8abeb7")
- **Hex Input**: Each color has editable hex input field synced with color picker
- **Import/Export**: JSON import and export with proper schema URL
- **Preset Themes**: Auto-detect themes via `index.json` manifest
- **Preview System**: Template-based previews (Markdown, Tool Diffs, Syntax Highlighting, Bash Mode, Warning) with [preview] [picker] [hex-input] [✓] editing flow; hover over text to see color info (token, purpose, hex value)
- **Empty Value Handling**: Empty strings show diagonal stripe pattern in preview, black in picker
- **Accessibility**: Keyboard navigation support with proper ARIA attributes

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Usage

1. Select a preset theme from the dropdown or import a JSON file
2. Expand color groups to view individual colors
3. Click preview swatch to open color picker
4. Edit hex value directly and press Enter to apply
5. Add/remove custom variables in the Vars section
6. Export your theme as JSON when done

## Schema

Exported JSON includes:
```json
{
  "$schema": "https://raw.githubusercontent.com/badlogic/pi-mono/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
  "name": "my-theme",
  "vars": { ... },
  "colors": { ... },
  "export": { ... }
}
```

## License

MIT

