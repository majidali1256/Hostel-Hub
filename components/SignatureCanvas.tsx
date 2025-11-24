import React, { useState, useRef } from 'react';
import SignaturePad from 'react-signature-canvas';

interface SignatureCanvasProps {
    onSave: (data: { type: 'drawn' | 'typed'; data: string }) => void;
    onCancel: () => void;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onCancel }) => {
    const [mode, setMode] = useState<'draw' | 'type'>('draw');
    const [typedSignature, setTypedSignature] = useState('');
    const sigPad = useRef<SignaturePad>(null);
    const [consent, setConsent] = useState(false);

    const clear = () => {
        sigPad.current?.clear();
        setTypedSignature('');
    };

    const handleSave = () => {
        if (!consent) {
            alert('Please agree to the terms before signing.');
            return;
        }

        if (mode === 'draw') {
            if (sigPad.current?.isEmpty()) {
                alert('Please draw your signature.');
                return;
            }
            onSave({
                type: 'drawn',
                data: sigPad.current?.getTrimmedCanvas().toDataURL('image/png') || ''
            });
        } else {
            if (!typedSignature.trim()) {
                alert('Please type your signature.');
                return;
            }
            // Create canvas from text
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.font = 'italic 48px "Dancing Script", cursive';
                ctx.fillStyle = 'black';
                ctx.fillText(typedSignature, 20, 60);
                onSave({
                    type: 'typed',
                    data: canvas.toDataURL('image/png')
                });
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Sign Agreement</h3>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setMode('draw')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === 'draw' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                >
                    Draw
                </button>
                <button
                    onClick={() => setMode('type')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === 'type' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                >
                    Type
                </button>
            </div>

            {/* Signature Area */}
            <div className="border-2 border-gray-200 rounded-lg mb-4 bg-gray-50 relative">
                {mode === 'draw' ? (
                    <SignaturePad
                        ref={sigPad}
                        canvasProps={{
                            className: 'w-full h-48 cursor-crosshair',
                        }}
                    />
                ) : (
                    <div className="h-48 flex items-center justify-center px-4">
                        <input
                            type="text"
                            value={typedSignature}
                            onChange={(e) => setTypedSignature(e.target.value)}
                            placeholder="Type your full name"
                            className="w-full text-center text-4xl font-serif italic bg-transparent border-none focus:ring-0 placeholder-gray-300"
                            style={{ fontFamily: '"Dancing Script", cursive' }}
                        />
                    </div>
                )}

                {mode === 'draw' && (
                    <button
                        onClick={clear}
                        className="absolute top-2 right-2 text-xs text-gray-500 hover:text-red-600 bg-white px-2 py-1 rounded border border-gray-200"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Consent */}
            <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                        I agree to sign this document electronically. I understand that my electronic signature has the same legal effect and validity as my handwritten signature.
                    </span>
                </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={!consent}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    Sign Document
                </button>
            </div>
        </div>
    );
};

export default SignatureCanvas;
