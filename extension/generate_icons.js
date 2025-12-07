const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// A simple 1x1 pixel transparent PNG base64
// actually let's use a blue square 16x16 approx
// This is a minimal valid PNG header + IHDR + IDAT + IEND
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAALUlEQVRYR+3QQREAAAgEMdfVr4cyR0UOJgT92SuZuAEAAPwPvQAAAAAAAADgWx5+fQHeHw6zAAAAAElFTkSuQmCC';
// This is actually 32x32. It will scale.

const buffer = Buffer.from(base64Png, 'base64');

const sizes = ['icon16.png', 'icon48.png', 'icon128.png'];

sizes.forEach(file => {
    fs.writeFileSync(path.join(iconsDir, file), buffer);
    console.log(`Created ${file}`);
});
