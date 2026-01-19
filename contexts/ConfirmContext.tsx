import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: '',
        message: ''
    });

    // Check for native dialog element to prevent focus trap issues if needed
    const cancelRef = useRef<HTMLButtonElement>(null);

    const resolveRef = useRef<(value: boolean) => void>(() => { });

    const confirm = useCallback((options: ConfirmOptions) => {
        setOptions({
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            type: 'info',
            ...options
        });
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef.current(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef.current(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100 opacity-100"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="p-6">
                            <h3 className={`text-lg font-bold mb-2 ${options.type === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                                }`}>
                                {options.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {options.message}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3">
                            <button
                                ref={cancelRef}
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                {options.cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 text-white font-medium rounded-lg shadow-sm transition-colors ${options.type === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {options.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};
