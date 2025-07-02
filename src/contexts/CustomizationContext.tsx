'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

// Available fonts for 90s/MySpace aesthetic
export const AVAILABLE_FONTS = [
  {
    id: 'times',
    name: 'Times New Roman',
    cssValue: '"Times New Roman", Times, serif',
  },
  { id: 'comic', name: 'Comic Sans MS', cssValue: '"Comic Sans MS", cursive' },
  {
    id: 'courier',
    name: 'Courier New',
    cssValue: '"Courier New", Courier, monospace',
  },
] as const;

export type FontId = (typeof AVAILABLE_FONTS)[number]['id'];

export interface CustomizationSettings {
  fontFamily: FontId;
  textColor: string;
  backgroundOpacity: number;
  backgroundTiled: boolean;
  backgroundPositionX: number; // 0-100 percentage
  backgroundPositionY: number; // 0-100 percentage
}

export interface BackgroundImageState {
  backgroundImage: string | null;
  isLoading: boolean;
}

export interface CustomizationContextType {
  settings: CustomizationSettings;
  backgroundImageState: BackgroundImageState;
  updateFont: (fontId: FontId) => void;
  updateTextColor: (color: string) => void;
  uploadBackgroundImage: (file: File) => Promise<void>;
  removeBackgroundImage: () => Promise<void>;
  updateBackgroundOpacity: (opacity: number) => void;
  updateBackgroundTiled: (tiled: boolean) => void;
  updateBackgroundPosition: (x: number, y: number) => void;
  resetToDefaults: () => void;
  syncFromDatabase: () => Promise<void>;
}

const defaultSettings: CustomizationSettings = {
  fontFamily: 'times',
  textColor: '#000000',
  backgroundOpacity: 0.3,
  backgroundTiled: true,
  backgroundPositionX: 50, // center
  backgroundPositionY: 50, // center
};

const defaultBackgroundImageState: BackgroundImageState = {
  backgroundImage: null,
  isLoading: false,
};

const CustomizationContext = createContext<
  CustomizationContextType | undefined
>(undefined);

// Helper function to validate and normalize settings
const validateSettings = (savedSettings: any): CustomizationSettings => {
  return {
    fontFamily: savedSettings.fontFamily || defaultSettings.fontFamily,
    textColor: savedSettings.textColor || defaultSettings.textColor,
    backgroundOpacity:
      savedSettings.backgroundOpacity ?? defaultSettings.backgroundOpacity,
    backgroundTiled:
      savedSettings.backgroundTiled ?? defaultSettings.backgroundTiled,
    backgroundPositionX:
      savedSettings.backgroundPositionX ?? defaultSettings.backgroundPositionX,
    backgroundPositionY:
      savedSettings.backgroundPositionY ?? defaultSettings.backgroundPositionY,
  };
};

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] =
    useState<CustomizationSettings>(defaultSettings);
  const [backgroundImageState, setBackgroundImageState] =
    useState<BackgroundImageState>(defaultBackgroundImageState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from database only (no more cookie fallback)
  useEffect(() => {
    // Only run in the browser to prevent hydration mismatches
    if (typeof window === 'undefined') return;

    const loadSettings = async () => {
      try {
        console.log('🌐 Loading customization from database...');
        const response = await fetch('/api/user/customization', {
          method: 'GET',
        });

        if (response.ok) {
          const dbSettings = await response.json();
          console.log('📖 Database settings loaded:', dbSettings);

          if (dbSettings && Object.keys(dbSettings).length > 0) {
            const validatedSettings = validateSettings(dbSettings);
            console.log('✅ Database settings validated:', validatedSettings);
            setSettings(validatedSettings);
            return;
          }
        } else {
          console.log('⚠️ Database load failed, using defaults');
        }
      } catch (dbError) {
        console.log('❌ Database load error, using defaults:', dbError);
      }

      // Use defaults if database fails or has no data
      console.log('📭 No customization data found, using defaults');
      setSettings(defaultSettings);
    };

    const loadBackgroundImage = async () => {
      try {
        console.log('🖼️ Loading background image from database...');
        const response = await fetch('/api/user/backgroundImage', {
          method: 'GET',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.backgroundImage) {
            console.log('✅ Background image loaded from database');
            // Extract URL string from potential object wrapper
            const imageUrl =
              typeof result.data.backgroundImage === 'string'
                ? result.data.backgroundImage
                : result.data.backgroundImage.text ||
                  result.data.backgroundImage;
            console.log('🔗 Extracted image URL:', imageUrl);
            setBackgroundImageState({
              backgroundImage: imageUrl,
              isLoading: false,
            });
          } else {
            console.log('📭 No background image found in database');
            setBackgroundImageState(defaultBackgroundImageState);
          }
        } else {
          console.log('⚠️ Background image load failed');
          setBackgroundImageState(defaultBackgroundImageState);
        }
      } catch (error) {
        console.log('❌ Background image load error:', error);
        setBackgroundImageState(defaultBackgroundImageState);
      }
    };

    loadSettings().finally(() => {
      setIsLoaded(true);
    });

    loadBackgroundImage();
  }, []);

  // Save settings automatically to database (removed cookie dependency)
  const saveSettings = async (newSettings: CustomizationSettings) => {
    try {
      console.log('💾 Auto-saving new customization settings:', newSettings);

      // Update local state immediately for responsive UI
      setSettings(newSettings);

      // Save to database automatically
      try {
        console.log('💾 Auto-saving to database...');
        const response = await fetch('/api/user/customization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });

        if (response.ok) {
          console.log('✅ Database auto-save successful');
        } else {
          console.warn('⚠️ Database auto-save failed:', response.status);
        }
      } catch (dbError) {
        console.warn('❌ Database auto-save error:', dbError);
      }
    } catch (error) {
      console.error('Failed to save customization settings:', error);
      // Ensure we still update local state even if database save fails
      setSettings(newSettings);
    }
  };

  const updateFont = (fontId: FontId) => {
    saveSettings({ ...settings, fontFamily: fontId });
  };

  const updateTextColor = (color: string) => {
    saveSettings({ ...settings, textColor: color });
  };

  const uploadBackgroundImage = async (file: File) => {
    setBackgroundImageState((prev) => ({ ...prev, isLoading: true }));

    try {
      console.log('📤 Uploading background image...');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/backgroundImage', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Background image uploaded successfully');
        // Extract URL string from potential object wrapper
        const rawImage = result.backgroundImage || result.data?.backgroundImage;
        const imageUrl =
          typeof rawImage === 'string' ? rawImage : rawImage?.text || rawImage;
        console.log('🔗 Extracted uploaded image URL:', imageUrl);
        setBackgroundImageState({
          backgroundImage: imageUrl,
          isLoading: false,
        });
      } else {
        console.error('❌ Background image upload failed:', response.status);
        setBackgroundImageState((prev) => ({ ...prev, isLoading: false }));
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('❌ Background image upload error:', error);
      setBackgroundImageState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const removeBackgroundImage = async () => {
    setBackgroundImageState((prev) => ({ ...prev, isLoading: true }));

    try {
      console.log('🗑️ Removing background image...');
      const response = await fetch('/api/user/backgroundImage', {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('✅ Background image removed successfully');
        setBackgroundImageState({
          backgroundImage: null,
          isLoading: false,
        });
      } else {
        console.error('❌ Background image removal failed:', response.status);
        setBackgroundImageState((prev) => ({ ...prev, isLoading: false }));
        throw new Error('Removal failed');
      }
    } catch (error) {
      console.error('❌ Background image removal error:', error);
      setBackgroundImageState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const updateBackgroundOpacity = (opacity: number) => {
    saveSettings({ ...settings, backgroundOpacity: opacity });
  };

  const updateBackgroundTiled = (tiled: boolean) => {
    saveSettings({ ...settings, backgroundTiled: tiled });
  };

  const updateBackgroundPosition = (x: number, y: number) => {
    saveSettings({
      ...settings,
      backgroundPositionX: x,
      backgroundPositionY: y,
    });
  };

  const resetToDefaults = () => {
    saveSettings(defaultSettings);
  };

  const syncFromDatabase = async () => {
    try {
      console.log('🔄 Manual sync from database...');
      const response = await fetch('/api/user/customization', {
        method: 'GET',
      });

      if (response.ok) {
        const dbSettings = await response.json();
        if (dbSettings && Object.keys(dbSettings).length > 0) {
          const validatedSettings = validateSettings(dbSettings);
          console.log('✅ Manual sync successful:', validatedSettings);
          setSettings(validatedSettings);
        }
      } else {
        console.warn('⚠️ Manual sync failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Manual sync error:', error);
    }
  };

  // Apply styles to document when settings change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      console.log('🎨 Applying styles with settings:', settings);
      console.log('🖼️ Background image for CSS:', {
        hasImage: !!backgroundImageState.backgroundImage,
        imageUrl: backgroundImageState.backgroundImage,
        isLoaded,
      });

      const root = document.documentElement;
      const font = AVAILABLE_FONTS.find((f) => f.id === settings.fontFamily);

      // Set CSS custom properties - always apply, even if not loaded yet
      root.style.setProperty(
        '--custom-font-family',
        font?.cssValue || defaultSettings.fontFamily,
      );
      root.style.setProperty('--custom-text-color', settings.textColor);

      if (
        backgroundImageState.backgroundImage &&
        typeof backgroundImageState.backgroundImage === 'string'
      ) {
        console.log('✅ Setting background image CSS properties');
        console.log(
          '🔗 CSS background URL:',
          backgroundImageState.backgroundImage,
        );
        root.style.setProperty(
          '--custom-background-image',
          `url(${backgroundImageState.backgroundImage})`,
        );

        if (settings.backgroundTiled) {
          // Tiled background (90s style)
          root.style.setProperty('--custom-background-repeat', 'repeat');
          root.style.setProperty('--custom-background-size', 'auto');
          root.style.setProperty(
            '--custom-background-position',
            `${settings.backgroundPositionX}% ${settings.backgroundPositionY}%`,
          );
        } else {
          // Positioned background
          root.style.setProperty('--custom-background-repeat', 'no-repeat');
          root.style.setProperty('--custom-background-size', 'cover');
          root.style.setProperty(
            '--custom-background-position',
            `${settings.backgroundPositionX}% ${settings.backgroundPositionY}%`,
          );
        }

        root.style.setProperty('--custom-background-attachment', 'fixed');
        root.style.setProperty(
          '--custom-background-opacity',
          settings.backgroundOpacity.toString(),
        );
      } else {
        console.log('❌ Removing background image CSS properties');
        root.style.removeProperty('--custom-background-image');
        root.style.removeProperty('--custom-background-repeat');
        root.style.removeProperty('--custom-background-size');
        root.style.removeProperty('--custom-background-position');
        root.style.removeProperty('--custom-background-attachment');
        root.style.removeProperty('--custom-background-opacity');
      }
    } catch (error) {
      console.warn('Failed to apply customization styles:', error);
    }
  }, [settings, backgroundImageState, isLoaded]);

  // eslint-disable-next-line
  const contextValue: CustomizationContextType = {
    settings,
    backgroundImageState,
    updateFont,
    updateTextColor,
    uploadBackgroundImage,
    removeBackgroundImage,
    updateBackgroundOpacity,
    updateBackgroundTiled,
    updateBackgroundPosition,
    resetToDefaults,
    syncFromDatabase,
  };

  return (
    <CustomizationContext.Provider value={contextValue}>
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (context === undefined) {
    throw new Error(
      'useCustomization must be used within a CustomizationProvider',
    );
  }
  return context;
}
