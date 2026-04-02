import React, { useState } from 'react';

interface FraudReportFormProps {
    hostelId?: string;
    reportedUserId?: string;
    onSuccess?: () => void;
    onClose: () => void;
}

const FraudReportForm: React.FC<FraudReportFormProps> = ({
    hostelId,
    reportedUserId,
    onSuccess,
    onClose
}) => {
    const [formData, setFormData] = useState({
        type: 'fake_listing',
        description: '',
        evidenceUrls: [''],
        evidenceImages: ['']
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const reportTypes = [
        { value: 'fake_listing', label: 'Fake Listing', description: 'Property doesn\'t exist or is misrepresented' },
        { value: 'duplicate_images', label: 'Stolen Images', description: 'Images copied from other listings' },
        { value: 'suspicious_text', label: 'Suspicious Content', description: 'Scam keywords or contact info in description' },
        { value: 'scam', label: 'Scam/Fraud', description: 'Fraudulent payment requests or behavior' },
        { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
        { value: 'other', label: 'Other', description: 'Other fraudulent activity' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5001/api/fraud/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    hostelId,
                    reportedUserId,
                    type: formData.type,
                    description: formData.description,
                    evidence: {
                        urls: formData.evidenceUrls.filter(url => url.trim()),
                        images: formData.evidenceImages.filter(img => img.trim())
                    }
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to submit report');
            }

            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addEvidenceField = (type: 'urls' | 'images') => {
        if (type === 'urls') {
            setFormData(prev => ({
                ...prev,
                evidenceUrls: [...prev.evidenceUrls, '']
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                evidenceImages: [...prev.evidenceImages, '']
            }));
        }
    };

    const updateEvidence = (type: 'urls' | 'images', index: number, value: string) => {
        if (type === 'urls') {
            const newUrls = [...formData.evidenceUrls];
            newUrls[index] = value;
            setFormData(prev => ({ ...prev, evidenceUrls: newUrls }));
        } else {
            const newImages = [...formData.evidenceImages];
            newImages[index] = value;
            setFormData(prev => ({ ...prev, evidenceImages: newImages }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🚨 Report Fraud</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1 transition-all duration-200 active:scale-90"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Help us keep Hostel Hub safe by reporting suspicious activity.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Report Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            What type of fraud are you reporting? *
                        </label>
                        <div className="space-y-3">
                            {reportTypes.map((type) => (
                                <label
                                    key={type.value}
                                    className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${formData.type === type.value
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 dark:bg-gray-800'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="type"
                                        value={type.value}
                                        checked={formData.type === type.value}
                                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                        className="mt-1 text-red-600 focus:ring-red-500"
                                    />
                                    <div className="ml-3">
                                        <p className="font-semibold text-gray-900 dark:text-white">{type.label}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Detailed Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            required
                            rows={5}
                            maxLength={1000}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
                            placeholder="Please provide as much detail as possible about the fraudulent activity..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-end">
                            {formData.description.length}/1000 characters
                        </p>
                    </div>

                    {/* Evidence URLs */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Evidence URLs (optional)
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Links to other listings, websites, or sources that support your report
                        </p>
                        {formData.evidenceUrls.map((url, index) => (
                            <input
                                key={index}
                                type="url"
                                value={url}
                                onChange={(e) => updateEvidence('urls', index, e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="https://example.com/similar-listing"
                            />
                        ))}
                        <button
                            type="button"
                            onClick={() => addEvidenceField('urls')}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center transition-colors"
                        >
                            + Add another URL
                        </button>
                    </div>

                    {/* Evidence Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Evidence Images (optional)
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Screenshots or image URLs that support your report
                        </p>
                        {formData.evidenceImages.map((img, index) => (
                            <input
                                key={index}
                                type="url"
                                value={img}
                                onChange={(e) => updateEvidence('images', index, e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 hover:border-gray-400 transition-all duration-200"
                                placeholder="https://example.com/screenshot.jpg"
                            />
                        ))}
                        <button
                            type="button"
                            onClick={() => addEvidenceField('images')}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center transition-colors"
                        >
                            + Add another image
                        </button>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.description}
                            className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-sm shadow-red-600/20"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FraudReportForm;
