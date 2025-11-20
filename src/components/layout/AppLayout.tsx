import React from 'react';
import { TopBar } from './TopBar';
import NoiseOverlay from './NoiseOverlay';
import { useAppStore } from '../../store/appStore';
import PropertyDetailModal from '../../features/portfolio/PropertyDetailModal';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { modalPropertyId, calculatedProperties, closePropertyModal } = useAppStore(state => ({
    modalPropertyId: state.modalPropertyId,
    calculatedProperties: state.calculatedProperties,
    closePropertyModal: state.closePropertyModal,
  }));

  const modalProperty = calculatedProperties.find(p => p.id === modalPropertyId);

  return (
    <>
      <NoiseOverlay />
      <div className="relative min-h-screen bg-background flex flex-col">
        <TopBar />
        <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4">
          {children}
        </main>
      </div>
       {modalProperty && (
        <PropertyDetailModal 
          property={modalProperty}
          onClose={closePropertyModal} 
        />
      )}
    </>
  );
};