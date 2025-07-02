/* eslint-disable jsx-a11y/no-static-element-interactions */

'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';

import {
  AVAILABLE_FONTS,
  useCustomization,
} from '@/contexts/CustomizationContext';

export default function CustomizationSettings() {
  const {
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
  } = useCustomization();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    backgroundImageState.backgroundImage,
  );
  const [syncing, setSyncing] = useState(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleImageUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;

    try {
      await uploadBackgroundImage(imageFile);
      setImageFile(null);
      setImagePreview(null); // Will be updated from context
    } catch (error) {
      console.error('Failed to upload background image:', error);
      // Reset state on error
      setImageFile(null);
      setImagePreview(backgroundImageState.backgroundImage);
    }
  };

  const handleRemoveBackground = async () => {
    try {
      await removeBackgroundImage();
      setImagePreview(null);
      setImageFile(null);
    } catch (error) {
      console.error('Failed to remove background image:', error);
    }
  };

  const handleSyncFromDatabase = async () => {
    setSyncing(true);
    try {
      await syncFromDatabase();
      setImagePreview(backgroundImageState.backgroundImage);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="custom-overlay mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        90s Style Customization
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        Customize your site with that authentic 90s/MySpace vibe! Choose fonts,
        colors, and backgrounds.
      </p>

      {/* Font Selection */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">
          Font Family
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {AVAILABLE_FONTS.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => updateFont(font.id)}
              className={`rounded-lg p-4 text-left transition-all ${
                settings.fontFamily === font.id
                  ? 'border-2 border-blue-500 bg-blue-100 text-blue-900'
                  : 'border-2 border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
              style={{ fontFamily: font.cssValue }}
            >
              <div className="font-medium">{font.name}</div>
              <div className="text-sm opacity-75">The quick brown fox</div>
            </button>
          ))}
        </div>
      </div>

      {/* Text Color */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Text Color</h3>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={settings.textColor}
            onChange={(e) => updateTextColor(e.target.value)}
            className="size-12 cursor-pointer rounded-lg border-2 border-gray-300"
          />
          <div className="flex-1">
            <input
              type="text"
              value={settings.textColor}
              onChange={(e) => updateTextColor(e.target.value)}
              placeholder="#000000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="text-sm text-gray-600">
            Current:{' '}
            <span style={{ color: settings.textColor }}>
              {settings.textColor}
            </span>
          </div>
        </div>
      </div>

      {/* Background Image */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">
          Background Image
        </h3>

        {/* Current Background Preview */}
        {(imagePreview || backgroundImageState.backgroundImage) && (
          <div className="mb-4 rounded-lg border-2 border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Current Background:
              </span>
              <button
                type="button"
                onClick={handleRemoveBackground}
                className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
            <div
              className="h-32 w-full rounded border bg-gray-50 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${imagePreview || backgroundImageState.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleImageUpload} className="space-y-4">
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {imageFile && (
            <button
              type="submit"
              disabled={backgroundImageState.isLoading}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {backgroundImageState.isLoading
                ? 'Uploading...'
                : 'Set as Background'}
            </button>
          )}
        </form>

        <div className="mt-2 text-xs text-gray-500">
          <p>
            Tip: Choose a tiled pattern or texture for that authentic 90s look!
          </p>
          <p>Supported formats: JPG, PNG, GIF, WebP</p>
        </div>

        {/* Background Opacity Control */}
        {backgroundImageState.backgroundImage && (
          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-base font-medium text-gray-900">
              Background Opacity
            </h4>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Subtle</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={settings.backgroundOpacity}
                onChange={(e) =>
                  updateBackgroundOpacity(parseFloat(e.target.value))
                }
                className="slider h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200"
              />
              <span className="text-sm text-gray-600">Bold</span>
              <div className="min-w-12 text-sm font-medium text-gray-700">
                {Math.round(settings.backgroundOpacity * 100)}%
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Adjust how visible the background image is behind your content
            </p>
          </div>
        )}

        {/* Background Tiling Toggle */}
        {backgroundImageState.backgroundImage && (
          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-base font-medium text-gray-900">
                  Background Style
                </h4>
                <p className="text-sm text-gray-600">
                  Choose between tiled pattern (90s style) or centered cover
                </p>
              </div>
              <div className="ml-4">
                <label
                  htmlFor="backgroundTiled"
                  className="relative inline-flex cursor-pointer items-center"
                >
                  <input
                    id="backgroundTiled"
                    type="checkbox"
                    checked={settings.backgroundTiled}
                    onChange={(e) => updateBackgroundTiled(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300" />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.backgroundTiled ? 'Tiled' : 'Centered'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Background Position Control */}
        {backgroundImageState.backgroundImage && !settings.backgroundTiled && (
          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-base font-medium text-gray-900">
              Background Position
            </h4>
            <p className="mb-3 text-sm text-gray-600">
              Drag the crosshair to position your background image
            </p>
            <div className="relative">
              {/* Position Control Area */}
              <div
                className="relative h-32 w-full cursor-crosshair overflow-hidden rounded border-2 border-gray-300 bg-gray-100"
                style={{
                  backgroundImage: `url(${backgroundImageState.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `${settings.backgroundPositionX}% ${settings.backgroundPositionY}%`,
                }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const x = Math.max(
                      0,
                      Math.min(
                        100,
                        ((moveEvent.clientX - rect.left) / rect.width) * 100,
                      ),
                    );
                    const y = Math.max(
                      0,
                      Math.min(
                        100,
                        ((moveEvent.clientY - rect.top) / rect.height) * 100,
                      ),
                    );
                    updateBackgroundPosition(Math.round(x), Math.round(y));
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);

                  // Initial position set
                  const x = Math.max(
                    0,
                    Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
                  );
                  const y = Math.max(
                    0,
                    Math.min(100, ((e.clientY - rect.top) / rect.height) * 100),
                  );
                  updateBackgroundPosition(Math.round(x), Math.round(y));
                }}
              >
                {/* Crosshair indicator */}
                <div
                  className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${settings.backgroundPositionX}%`,
                    top: `${settings.backgroundPositionY}%`,
                  }}
                >
                  <div className="size-full rounded-full border-2 border-white bg-blue-500 shadow-lg">
                    <div className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              {/* Position Values */}
              <div className="mt-2 flex justify-between text-xs text-gray-600">
                <span>X: {settings.backgroundPositionX}%</span>
                <span>Y: {settings.backgroundPositionY}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset and Sync Buttons */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={resetToDefaults}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={handleSyncFromDatabase}
            disabled={syncing}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync from Database'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Sync from Database loads your saved settings from the server
        </p>
      </div>

      {/* Preview Section */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Preview</h3>
        <div
          className="relative rounded-lg border-2 border-gray-300 p-6"
          style={{
            fontFamily: AVAILABLE_FONTS.find(
              (f) => f.id === settings.fontFamily,
            )?.cssValue,
            color: settings.textColor,
          }}
        >
          {backgroundImageState.backgroundImage && (
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                backgroundImage: `url(${backgroundImageState.backgroundImage})`,
                backgroundSize: settings.backgroundTiled ? 'auto' : 'cover',
                backgroundRepeat: settings.backgroundTiled
                  ? 'repeat'
                  : 'no-repeat',
                backgroundPosition: settings.backgroundTiled
                  ? `${settings.backgroundPositionX}% ${settings.backgroundPositionY}%`
                  : `${settings.backgroundPositionX}% ${settings.backgroundPositionY}%`,
                opacity: settings.backgroundOpacity,
                zIndex: -1,
              }}
            />
          )}
          <div
            className="rounded bg-white/90 p-4 backdrop-blur-sm"
            style={{
              backdropFilter: backgroundImageState.backgroundImage
                ? 'blur(2px)'
                : 'none',
            }}
          >
            <h4 className="mb-2 text-xl font-bold">
              Welcome to Your Customized Site!
            </h4>
            <p className="mb-2">
              This is how your text will look with the current settings.
            </p>
            <p className="text-sm">
              Font:{' '}
              {AVAILABLE_FONTS.find((f) => f.id === settings.fontFamily)?.name}
            </p>
            <p className="text-sm">Color: {settings.textColor}</p>
            <p className="text-sm">
              Background:{' '}
              {backgroundImageState.backgroundImage
                ? `Custom Image (${Math.round(settings.backgroundOpacity * 100)}% opacity, ${settings.backgroundTiled ? 'Tiled' : 'Positioned'} ${settings.backgroundPositionX}%,${settings.backgroundPositionY}%)`
                : 'None'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
