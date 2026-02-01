import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { modLoader } from '../../lib/modLoader';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function PaymentModal({ mod, user, isOpen, onClose, onSuccess }) {
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [error, setError] = useState('');

    const handlePayment = async (e) => {
        e.preventDefault();
        setError('');
        setProcessing(true);

        try {
            // Validate inputs
            if (!cardNumber || !expiryDate || !cvv) {
                throw new Error('Please fill in all payment details');
            }

            // Simulate payment processing
            // In production, this would call Stripe/PayPal API
            await simulatePayment();

            // Record purchase
            modLoader.recordPurchase(mod.id, user.uid, mod.price);

            // Update download count in Firebase
            await updateDoc(doc(db, 'marketplace_mods', mod.id), {
                downloads: increment(1)
            });

            // Show success
            alert(`✓ Payment successful! ${mod.title} has been added to your library.`);

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const simulatePayment = () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 95% success rate
                if (Math.random() > 0.05) {
                    resolve();
                } else {
                    reject(new Error('Payment declined. Please check your card details.'));
                }
            }, 2000);
        });
    };

    const formatCardNumber = (value) => {
        const cleaned = value.replace(/\s/g, '');
        const chunks = cleaned.match(/.{1,4}/g) || [];
        return chunks.join(' ').substr(0, 19);
    };

    const formatExpiryDate = (value) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2);
        }
        return cleaned;
    };

    if (!isOpen) return null;

    const platformFee = (mod.price * 0.30).toFixed(2);
    const creatorEarnings = (mod.price * 0.70).toFixed(2);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    className="relative w-full max-w-md bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-2 border-white/20 rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="border-b border-white/10 bg-gradient-to-r from-zinc-900/90 to-black/90 backdrop-blur-xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Complete Purchase</h2>
                                    <p className="text-xs text-zinc-400 mt-0.5">Secure payment processing</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6 text-zinc-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Mod Info */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                            <div className="flex items-start gap-4">
                                {mod.thumbnailUrl && (
                                    <img
                                        src={mod.thumbnailUrl}
                                        alt={mod.title}
                                        className="w-16 h-16 rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-1">
                                    <h3 className="font-bold text-white">{mod.title}</h3>
                                    <p className="text-sm text-zinc-400">by {mod.author}</p>
                                    <div className="mt-2 text-2xl font-black text-emerald-400">
                                        ${mod.price.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-bold text-white mb-3">Payment Method</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-3 rounded-xl border-2 transition-all ${paymentMethod === 'card'
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-white" />
                                    <div className="text-xs font-bold text-white">Card</div>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('paypal')}
                                    className={`p-3 rounded-xl border-2 transition-all ${paymentMethod === 'paypal'
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="text-lg font-black text-white mb-1">PP</div>
                                    <div className="text-xs font-bold text-white">PayPal</div>
                                </button>
                            </div>
                        </div>

                        {/* Payment Form */}
                        {paymentMethod === 'card' ? (
                            <form onSubmit={handlePayment} className="space-y-4">
                                {/* Card Number */}
                                <div>
                                    <label className="block text-sm font-bold text-white mb-2">Card Number</label>
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        placeholder="1234 5678 9012 3456"
                                        maxLength="19"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                                        required
                                    />
                                </div>

                                {/* Expiry & CVV */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-white mb-2">Expiry Date</label>
                                        <input
                                            type="text"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                                            placeholder="MM/YY"
                                            maxLength="5"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-white mb-2">CVV</label>
                                        <input
                                            type="text"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substr(0, 3))}
                                            placeholder="123"
                                            maxLength="3"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                        <p className="text-sm text-red-400">{error}</p>
                                    </div>
                                )}

                                {/* Revenue Split Info */}
                                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs space-y-1">
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Creator earnings (70%)</span>
                                        <span className="text-emerald-400 font-bold">${creatorEarnings}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Platform fee (30%)</span>
                                        <span className="text-zinc-500 font-bold">${platformFee}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-white/10 flex justify-between text-white font-bold">
                                        <span>Total</span>
                                        <span className="text-emerald-400">${mod.price.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Security Notice */}
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <Lock className="w-4 h-4" />
                                    <span>Secure payment powered by Stripe</span>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Pay ${mod.price.toFixed(2)}
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-zinc-400 mb-4">PayPal integration coming soon!</p>
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className="text-emerald-400 hover:text-emerald-300 font-bold"
                                >
                                    Use Card Instead
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
