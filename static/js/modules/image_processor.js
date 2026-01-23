/**
 * Service for Image Processing.
 */
export const ImageProcessor = {
    /**
     * Compresses an image file to a specific max width/height and quality.
     * @param {File} file - The image file to compress.
     * @param {Function} callback - Callback function receiving the compressed Blob.
     * @param {number} [quality=0.7] - JPEG quality (0 to 1).
     * @param {number} [maxWidth=1200] - Maximum width in pixels.
     * @param {number} [maxHeight=1200] - Maximum height in pixels.
     */
    compress(file, callback, quality = 0.7, maxWidth = 1200, maxHeight = 1200) {
        if (!file || !(file instanceof File)) {
            console.error('ImageProcessor: Invalid file provided.');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if(typeof callback === 'function') callback(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = () => {
                console.error('ImageProcessor: Failed to load image.');
                if(typeof callback === 'function') callback(null);
            };
        };
        reader.onerror = () => {
            console.error('ImageProcessor: Failed to read file.');
        };
    }
};
