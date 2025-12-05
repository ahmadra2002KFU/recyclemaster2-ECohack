
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getThemeClasses } from '../../utils/themeConfig';
import LanguageSelector from '../LanguageSelector';

const ProfilePage: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const colors = getThemeClasses(theme);

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('userName') || '';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  useEffect(() => {
    localStorage.setItem('userName', userName);
  }, [userName]);

  const handleSaveName = () => {
    setUserName(tempName.trim());
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setTempName(userName);
    setIsEditingName(false);
  };

  return (
    <div className="flex flex-col items-center text-center space-y-8 p-4">
      <div className="relative">
        <img
          src="https://picsum.photos/128"
          alt="User Avatar"
          className={`w-32 h-32 rounded-full border-4 ${theme === 'dark' ? 'border-green-400' : 'border-green-600'} shadow-lg`}
        />
      </div>

      {isEditingName ? (
        <div className="flex flex-col items-center space-y-2">
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder={t('profile.enterName')}
            className={`text-2xl font-bold text-center px-4 py-2 rounded-lg ${colors.bgInput} ${colors.textPrimary} focus:outline-none focus:ring-2 ${theme === 'dark' ? 'focus:ring-green-500' : 'focus:ring-green-600'}`}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveName();
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSaveName}
              className={`px-4 py-1 ${colors.btnPrimary} ${colors.btnPrimaryHover} rounded-lg text-white text-sm font-medium`}
            >
              {t('profile.save')}
            </button>
            <button
              onClick={handleCancelEdit}
              className={`px-4 py-1 ${colors.btnSecondary} ${colors.btnSecondaryHover} rounded-lg text-sm font-medium`}
            >
              {t('profile.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <h2
          className={`text-3xl font-bold ${colors.textPrimary} cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={() => {
            setTempName(userName);
            setIsEditingName(true);
          }}
          title={t('profile.clickToEdit')}
        >
          {userName || t('profile.tapToSetName')}
        </h2>
      )}
      <p className={colors.textTertiary}>{t('profile.recyclingEnthusiast')}</p>

      <div className={`w-full max-w-md p-6 ${colors.bgCard} rounded-2xl shadow-lg space-y-4`}>
        <h3 className={`text-xl font-semibold ${colors.textPrimary}`}>{t('profile.statistics')}</h3>
        <div className="flex justify-around">
          <div className="text-center">
            <p className={`text-2xl font-bold ${colors.textAccent}`}>14.5 kg</p>
            <p className={colors.textTertiary}>{t('profile.materialRecycled')}</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${colors.textAccent}`}>218</p>
            <p className={colors.textTertiary}>{t('profile.hoursActive')}</p>
          </div>
        </div>
      </div>

      <div className={`w-full max-w-md p-6 ${colors.bgCard} rounded-2xl shadow-lg space-y-4`}>
        <h3 className={`text-xl font-semibold ${colors.textPrimary} mb-4`}>{t('profile.settings')}</h3>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
              {t('profile.language')}
            </label>
            <LanguageSelector />
          </div>
        </div>
      </div>

      <div className={`w-full max-w-md p-6 ${colors.bgCard} rounded-2xl shadow-lg space-y-4`}>
        <button className={`w-full py-3 ${colors.accentRed} ${colors.accentRedHover} rounded-lg font-semibold text-white transition-colors`}>
          {t('profile.logout')}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
