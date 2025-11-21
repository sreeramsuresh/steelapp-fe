const sharp = require('sharp');
const fs = require('fs');

const inputPath = '/mnt/d/Chrome Downloads/brand logo.jpeg';
const outputPath = '/mnt/d/Chrome Downloads/brand-logo-transparent.png';

async function optimizeLogo() {
  try {
    console.log('Processing logo with white background removal...');

    const image = sharp(inputPath);
    const metadata = await image.metadata();
    console.log('Original:', metadata.width, 'x', metadata.height, metadata.format);

    // Get raw pixel data
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Process pixels - make white/near-white pixels transparent
    const threshold = 245; // Pixels with R,G,B all > 245 become transparent

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if pixel is white or near-white
      if (r > threshold && g > threshold && b > threshold) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    // Save processed image
    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log('Done! Transparent PNG created');
    console.log('Size:', info.width, 'x', info.height);
    console.log('File size:', Math.round(stats.size / 1024), 'KB');
    console.log('Saved to:', outputPath);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

optimizeLogo();
