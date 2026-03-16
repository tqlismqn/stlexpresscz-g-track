import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useAppInitialization() {
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if company exists
        const companies = await base44.entities.Company.list();
        
        if (companies.length === 0) {
          // Initialize company via backend function
          await base44.functions.invoke('initializeCompany', {});
        }

        // Compute document statuses and driver readiness
        await base44.functions.invoke('computeDocumentStatus', {});
        await base44.functions.invoke('computeDriverReadiness', {});
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initialize();
  }, []);
}