const Jimp = require('jimp');

async function makeCircle() {
    try {
        const img = await Jimp.read('./public/favicon.png');
        
        // Find minimum dimension
        const w = img.bitmap.width;
        const h = img.bitmap.height;
        const s = Math.min(w, h);
        
        // Crop it to square first (centered)
        img.crop((w - s) / 2, (h - s) / 2, s, s);
        
        // Make it a circle
        img.circle();

        await img.writeAsync('./public/favicon.png');
        console.log("Made circular favicon successfully!");
    } catch (err) {
        console.error("Error making circle:", err);
    }
}

makeCircle();
