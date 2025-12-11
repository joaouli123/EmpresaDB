import { createContext, useContext, useState } from 'react';

const ContactModalContext = createContext();

export const ContactModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ContactModalContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </ContactModalContext.Provider>
  );
};

export const useContactModal = () => {
  const context = useContext(ContactModalContext);
  if (!context) {
    throw new Error('useContactModal deve ser usado dentro de ContactModalProvider');
  }
  return context;
};
