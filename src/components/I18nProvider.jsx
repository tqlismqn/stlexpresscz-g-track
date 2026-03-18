import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { useAuth } from '@/lib/AuthContext';

export default function I18nProvider({ children }) {
  const { currentUser, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && currentUser?.language) {
      i18n.changeLanguage(currentUser.language);
    }
  }, [currentUser?.language, isLoadingAuth]);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}