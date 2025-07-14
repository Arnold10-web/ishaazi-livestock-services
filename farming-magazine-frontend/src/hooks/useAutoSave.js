import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for auto-saving form data to prevent content loss
 * 
 * Features:
 * - Automatic saving at specified intervals
 * - Debounced saving on content changes
 * - Local storage persistence
 * - Manual save capability
 * - Loading and error states
 * 
 * @param {Object} formData - The form data to auto-save
 * @param {string} storageKey - Unique key for localStorage
 * @param {Function} saveCallback - Optional server save function
 * @param {Object} options - Configuration options
 * @returns {Object} Auto-save utilities and state
 */
const useAutoSave = (
  formData, 
  storageKey, 
  saveCallback = null, 
  options = {}
) => {
  const {
    autoSaveInterval = 30000, // 30 seconds default
    debounceDelay = 2000, // 2 seconds debounce
    enableLocalStorage = true,
    enableServerSave = false,
    onSaveSuccess = null,
    onSaveError = null
  } = options;

  const debounceTimeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedDataRef = useRef(null);
  const isSavingRef = useRef(false);

  // Save to localStorage
  const saveToStorage = useCallback(() => {
    if (!enableLocalStorage) return;

    try {
      const dataToSave = {
        ...formData,
        lastSaved: new Date().toISOString(),
        version: Date.now() // Simple versioning
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      lastSavedDataRef.current = dataToSave;
      
      console.log(`✅ Auto-saved to localStorage: ${storageKey}`);
      
      if (onSaveSuccess) {
        onSaveSuccess('localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
      
      if (onSaveError) {
        onSaveError(error, 'localStorage');
      }
    }
  }, [formData, storageKey, enableLocalStorage, onSaveSuccess, onSaveError]);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      saveToStorage();
    }, debounceDelay);
  }, [debounceDelay, saveToStorage]);

  // Save to server
  const saveToServer = useCallback(async () => {
    if (!enableServerSave || !saveCallback || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      await saveCallback(formData);
      
      console.log(`✅ Auto-saved to server: ${storageKey}`);
      
      if (onSaveSuccess) {
        onSaveSuccess('server');
      }
    } catch (error) {
      console.error('❌ Failed to save to server:', error);
      
      if (onSaveError) {
        onSaveError(error, 'server');
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [formData, saveCallback, enableServerSave, storageKey, onSaveSuccess, onSaveError]);

  // Load saved data from localStorage
  const loadSavedData = useCallback(() => {
    if (!enableLocalStorage) return null;

    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log(`📂 Loaded saved data from localStorage: ${storageKey}`);
        return parsedData;
      }
    } catch (error) {
      console.error('❌ Failed to load from localStorage:', error);
    }
    
    return null;
  }, [storageKey, enableLocalStorage]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      console.log(`🗑️ Cleared saved data: ${storageKey}`);
    } catch (error) {
      console.error('❌ Failed to clear saved data:', error);
    }
  }, [storageKey]);

  // Manual save function
  const saveNow = useCallback(async () => {
    saveToStorage();
    
    if (enableServerSave && saveCallback) {
      await saveToServer();
    }
  }, [saveToStorage, saveToServer, enableServerSave, saveCallback]);

  // Check if data has changed
  const hasDataChanged = useCallback(() => {
    if (!lastSavedDataRef.current) return true;
    
    return JSON.stringify(formData) !== JSON.stringify(lastSavedDataRef.current);
  }, [formData]);

  // Set up auto-save interval
  useEffect(() => {
    if (autoSaveInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (hasDataChanged()) {
          saveToStorage();
          
          if (enableServerSave && saveCallback) {
            saveToServer();
          }
        }
      }, autoSaveInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoSaveInterval, hasDataChanged, saveToStorage, saveToServer, enableServerSave, saveCallback]);

  // Set up debounced save on data change
  useEffect(() => {
    if (hasDataChanged()) {
      debouncedSave();
    }
  }, [formData, debouncedSave, hasDataChanged]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasDataChanged()) {
        saveToStorage();
        
        // Show browser confirmation if there are unsaved changes
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasDataChanged, saveToStorage]);

  return {
    saveNow,
    loadSavedData,
    clearSavedData,
    hasUnsavedChanges: hasDataChanged(),
    isSaving: isSavingRef.current
  };
};

export default useAutoSave;
