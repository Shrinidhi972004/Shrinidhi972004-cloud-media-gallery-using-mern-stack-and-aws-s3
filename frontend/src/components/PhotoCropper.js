import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'react-toastify';
import { X, Check, RotateCcw } from 'lucide-react';

const PhotoCropper = ({ imageUrl, fileName, onSave, onCancel, token }) => {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch image data from our backend to avoid CORS issues
  useEffect(() => {
    const fetchImageData = async () => {
      try {
        // Extract filename from S3 URL
        const filename = imageUrl.split('/').pop();
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
        const proxyUrl = `${API_URL}/api/gallery/proxy-image/${encodeURIComponent(filename)}`;
        
        const response = await fetch(proxyUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch image');
        
        const blob = await response.blob();
        const dataUrl = URL.createObjectURL(blob);
        setImageDataUrl(dataUrl);
      } catch (error) {
        console.error('Error fetching image:', error);
        setImageError(true);
      }
    };

    fetchImageData();
  }, [imageUrl, token]);

  // Separate useEffect for cleanup to avoid dependency issues
  useEffect(() => {
    return () => {
      if (imageDataUrl) {
        URL.revokeObjectURL(imageDataUrl);
      }
    };
  }, [imageDataUrl]);

  const onImageLoad = useCallback((img) => {
    imgRef.current = img;
    setImageLoaded(true);
    setImageError(false);
    
    // Set initial crop to center of image
    const { naturalWidth, naturalHeight } = img;
    const aspect = naturalWidth / naturalHeight;
    
    let cropWidth = 80;
    let cropHeight = 80;
    
    if (aspect > 1) {
      // Landscape
      cropHeight = cropWidth / aspect;
    } else {
      // Portrait
      cropWidth = cropHeight * aspect;
    }
    
    setCrop({
      unit: '%',
      width: Math.min(cropWidth, 80),
      height: Math.min(cropHeight, 80),
      x: (100 - Math.min(cropWidth, 80)) / 2,
      y: (100 - Math.min(cropHeight, 80)) / 2
    });
  }, []);

  const onImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  const getCroppedImg = useCallback((image, crop) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas reference not found');
      return Promise.resolve(null);
    }
    
    const ctx = canvas.getContext('2d');

    if (!crop || !image) {
      console.error('Missing crop or image data', { crop, image });
      return Promise.resolve(null);
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    try {
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );
    } catch (error) {
      console.error('Error drawing image to canvas:', error);
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty - failed to create blob');
            resolve(null);
            return;
          }
          console.log('Successfully created blob from canvas:', { size: blob.size });
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  }, []);

  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error('Please select a crop area');
      return;
    }

    setIsSaving(true);
    try {
      console.log('Starting crop process...', { completedCrop, fileName });
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      
      if (!croppedImageBlob) {
        console.error('Failed to generate cropped image blob');
        toast.error('Failed to crop image');
        return;
      }

      console.log('Cropped image blob created:', { size: croppedImageBlob.size, type: croppedImageBlob.type });

      // Create a new file with the cropped image
      const croppedFile = new File([croppedImageBlob], fileName, { type: 'image/jpeg' });
      
      console.log('Calling onSave with cropped file:', { name: croppedFile.name, size: croppedFile.size });
      
      // Call the onSave callback with the cropped file
      await onSave(croppedFile);
      
      toast.success('Photo cropped and saved successfully!');
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetCrop = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const aspect = naturalWidth / naturalHeight;
      
      let cropWidth = 80;
      let cropHeight = 80;
      
      if (aspect > 1) {
        cropHeight = cropWidth / aspect;
      } else {
        cropWidth = cropHeight * aspect;
      }
      
      setCrop({
        unit: '%',
        width: Math.min(cropWidth, 80),
        height: Math.min(cropHeight, 80),
        x: (100 - Math.min(cropWidth, 80)) / 2,
        y: (100 - Math.min(cropHeight, 80)) / 2
      });
    } else {
      setCrop({
        unit: '%',
        width: 80,
        height: 80,
        x: 10,
        y: 10
      });
    }
    setCompletedCrop(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Crop Photo</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Cropper */}
        <div className="p-6 max-h-[70vh] overflow-auto">
          <div className="flex flex-col items-center">
            {imageError ? (
              <div className="w-full max-w-2xl h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <p className="text-gray-700 mb-2 font-medium">Failed to load image</p>
                  <p className="text-sm text-gray-500 mb-4">Could not fetch the image for cropping</p>
                  <button
                    onClick={onCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : !imageDataUrl ? (
              <div className="w-full max-w-2xl h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium mb-2">Fetching image...</p>
                  <p className="text-sm text-gray-500">Loading image from storage</p>
                </div>
              </div>
            ) : (
              <ReactCrop
                crop={crop}
                onChange={(newCrop) => setCrop(newCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined} // Allow free aspect ratio
                className="max-w-full border-2 border-gray-300 rounded-lg"
                style={{ maxHeight: '60vh' }}
              >
                <img
                  ref={imgRef}
                  src={imageDataUrl}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  onError={onImageError}
                  className="max-w-full max-h-[60vh] object-contain block"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </ReactCrop>
            )}
            
            {/* Hidden canvas for cropping */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>

          {/* Instructions */}
          {imageLoaded && !imageError && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium mb-1">How to crop:</p>
              <ul className="text-xs space-y-1">
                <li>• Drag the crop area to position it</li>
                <li>• Drag the corners to resize the crop area</li>
                <li>• Use the Reset button to start over</li>
              </ul>
            </div>
          )}

          {/* Crop Info */}
          {completedCrop && imageLoaded && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
              <p>Crop Area: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)} pixels</p>
              <p>Position: ({Math.round(completedCrop.x)}, {Math.round(completedCrop.y)})</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <button
            onClick={resetCrop}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCrop}
              disabled={isSaving || !completedCrop || !imageLoaded || imageError}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition"
            >
              <Check size={16} />
              {isSaving ? 'Saving...' : 'Save Cropped Photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCropper;
