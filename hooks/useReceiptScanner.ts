import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import MlkitOcr from 'react-native-mlkit-ocr';
import { parseReceiptText } from '@/lib/receiptParser';
import type { ReceiptData } from '@/types';

interface UseReceiptScannerReturn {
  isProcessing: boolean;
  receiptData: ReceiptData | null;
  imageUri: string | null;
  error: string | null;
  pickImage: (source: 'camera' | 'gallery') => Promise<boolean>;
  reset: () => void;
}

export function useReceiptScanner(): UseReceiptScannerReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setReceiptData(null);
    setImageUri(null);
    setError(null);
  }, []);

  const processImage = useCallback(async (uri: string): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await MlkitOcr.detectFromUri(uri);
      const fullText = result.map((block) => block.text).join('\n');
      const parsed = parseReceiptText(fullText);
      setReceiptData(parsed);
      return true;
    } catch {
      setError('receipt.scanError');
      setReceiptData(null);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const pickImage = useCallback(async (source: 'camera' | 'gallery'): Promise<boolean> => {
    setError(null);
    setReceiptData(null);

    const requestFn = source === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await requestFn();
    if (status !== 'granted') {
      setError('receipt.permissionRequired');
      return false;
    }

    const launchFn = source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await launchFn({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return false;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    return await processImage(uri);
  }, [processImage]);

  return { isProcessing, receiptData, imageUri, error, pickImage, reset };
}
