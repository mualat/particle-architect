import { useState, useEffect, useCallback } from 'react';

interface CameraCheckResult {
  hasCamera: boolean;
  isChecking: boolean;
  error: string | null;
  checkCamera: () => Promise<boolean>;
}

export function useCameraCheck(): CameraCheckResult {
  const [hasCamera, setHasCamera] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkCamera = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setError(null);

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera API not supported in this browser');
        setHasCamera(false);
        setIsChecking(false);
        return false;
      }

      // Try to get camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });

      // Immediately stop all tracks to release the camera
      stream.getTracks().forEach(track => track.stop());

      setHasCamera(true);
      setIsChecking(false);
      return true;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowed')) {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (errorMsg.includes('NotFound') || errorMsg.includes('DevicesNotFound')) {
        setError('No camera found. Please connect a camera to use Neural Navigation.');
      } else if (errorMsg.includes('NotReadable') || errorMsg.includes('SourceUnavailable')) {
        setError('Camera is in use by another application.');
      } else {
        setError(`Camera error: ${errorMsg}`);
      }
      
      setHasCamera(false);
      setIsChecking(false);
      return false;
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkCamera();
  }, [checkCamera]);

  return { hasCamera, isChecking, error, checkCamera };
}
