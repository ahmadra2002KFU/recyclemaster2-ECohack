
import React, { useState, useContext, useRef } from 'react';
import { getDeviceSettingsForMaterial } from '../../services/geminiService';
import { DeviceSettings } from '../../types';
import { AppContext } from '../../App';
import { Icon } from '../Icon';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getThemeClasses } from '../../utils/themeConfig';

const DeviceControlAI: React.FC = () => {
  const context = useContext(AppContext);
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const colors = getThemeClasses(theme);

  const [prompt, setPrompt] = useState<string>('');
  const [image, setImage] = useState<{ file: File, preview: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<Partial<DeviceSettings> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage({ file, preview: URL.createObjectURL(file) });
      setError('');
      setResult(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!prompt && !image) {
      setError(t('ai.errorProvideInput'));
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      let imageBase64: string | undefined;
      if (image) {
        imageBase64 = await fileToBase64(image.file);
      }
      const fullPrompt = `Analyze this material for recycling. Description: "${prompt || 'No description provided.'}"`;
      const settings = await getDeviceSettingsForMaterial(fullPrompt, imageBase64);
      setResult(settings);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const applySettings = () => {
    if (result && context) {
      context.setDeviceSettings(prev => ({ ...prev, ...result }));
      setResult(null); // Clear result after applying
    }
  };

  return (
    <div className={`p-4 ${colors.bgCard} rounded-2xl shadow-lg h-full flex flex-col space-y-4`}>
      <textarea
        className={`w-full p-3 ${colors.bgInput} rounded-lg ${colors.textPrimary} ${theme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'} focus:ring-2 ${theme === 'dark' ? 'focus:ring-green-500' : 'focus:ring-green-600'} focus:outline-none transition-shadow`}
        rows={3}
        placeholder={t('ai.describeMaterial')}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isLoading}
      />

      <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 py-3 px-4 ${colors.btnSecondary} ${colors.btnSecondaryHover} rounded-lg font-semibold transition-colors flex items-center justify-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}
          disabled={isLoading}
        >
          <Icon name="camera" />
          <span>{image ? t('ai.changeImage') : t('ai.addImage')}</span>
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
      </div>

      {image && (
        <div className={`relative w-full h-32 rounded-lg overflow-hidden border-2 ${colors.borderSecondary}`}>
          <img src={image.preview} alt="Material preview" className="w-full h-full object-cover" />
           <button onClick={() => setImage(null)} className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-2 bg-black/50 p-1 rounded-full text-white hover:bg-black/80`}>&times;</button>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className={`w-full py-3 px-4 ${colors.btnPrimary} ${colors.btnPrimaryHover} rounded-lg font-bold text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
        disabled={isLoading}
      >
        {isLoading ? t('ai.analyzing') : t('ai.getAiSettings')}
      </button>

      {error && <p className="text-red-400 text-center">{error}</p>}

      {result && (
        <div className={`p-4 ${colors.bgTertiary} rounded-lg space-y-3 animate-fade-in`}>
          <h3 className={`text-lg font-semibold ${colors.textPrimary}`}>{t('ai.suggestedSettings')}</h3>
          <ul className={`space-y-1 ${colors.textSecondary}`}>
            <li><strong>{t('ai.temperature')}:</strong> {result.temperature}°C</li>
            <li><strong>{t('ai.shredderSpeed')}:</strong> {result.shredderSpeed}%</li>
            <li><strong>{t('ai.extrusionSpeed')}:</strong> {result.extrusionSpeed}%</li>
            <li><strong>{t('ai.pullingSpeed')}:</strong> {result.pullingSpeed}%</li>
          </ul>
          <button
            onClick={applySettings}
            className={`w-full py-2 mt-2 ${colors.accentBlue} ${colors.accentBlueHover} rounded-lg font-semibold text-white transition-colors flex items-center justify-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}
          >
            <Icon name="check" />
            <span>{t('ai.applyToDevice')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DeviceControlAI;
