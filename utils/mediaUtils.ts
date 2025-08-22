/**
 * Generates a thumbnail from the first frame of a video file.
 * @param file The video file.
 * @returns A promise that resolves to a data URL (JPEG) of the thumbnail.
 */
export function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      return reject(new Error('Canvas 2D context is not supported.'));
    }

    video.addEventListener('loadeddata', () => {
      // Seek to the first frame
      video.currentTime = 0;
    });

    video.addEventListener('seeked', () => {
      // Ensure video dimensions are valid before setting canvas size
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return reject(new Error('Video has zero dimensions.'));
      }
      
      // Set canvas size to match video aspect ratio
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame onto the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get the thumbnail as a data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      // Clean up the object URL
      URL.revokeObjectURL(video.src);

      resolve(dataUrl);
    });

    video.addEventListener('error', (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error(`Failed to load video file: ${file.name}. Error: ${video.error?.message}`));
    });

    video.src = URL.createObjectURL(file);
    video.load();
  });
}

/**
 * Gets the duration of a video or audio file.
 * @param fileOrUrl The video/audio file or a blob URL.
 * @returns A promise that resolves to the duration in seconds.
 */
export function getVideoDuration(fileOrUrl: File | string): Promise<number> {
  return new Promise((resolve, reject) => {
    const mediaElement = document.createElement(
      typeof fileOrUrl === 'string' || fileOrUrl.type.startsWith('audio') ? 'audio' : 'video'
    );
    mediaElement.preload = 'metadata';

    mediaElement.onloadedmetadata = () => {
      URL.revokeObjectURL(mediaElement.src);
      resolve(mediaElement.duration);
    };

    mediaElement.onerror = () => {
      URL.revokeObjectURL(mediaElement.src);
      reject(new Error('Failed to load media metadata.'));
    };
    
    if (typeof fileOrUrl === 'string') {
        mediaElement.src = fileOrUrl;
    } else {
        mediaElement.src = URL.createObjectURL(fileOrUrl);
    }
  });
}


/**
 * Processes an image file by converting it to a BaseImage object with base64 data.
 * @param file The image file.
 * @returns A promise resolving to a BaseImage object.
 */
export function processImage(file: File): Promise<{ id: string; file: File; base64: string; mimeType: string; }> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            return reject(new Error('File is not a valid image.'));
        }
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({
                id: crypto.randomUUID(),
                file,
                base64: base64String,
                mimeType: file.type,
            });
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}