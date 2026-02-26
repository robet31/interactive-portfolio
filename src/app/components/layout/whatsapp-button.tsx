import { useState } from 'react';
import { MessageCircle, X, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'motion/react';

const PHONE_NUMBER = '6281515450611';

const MESSAGES = {
  casual: {
    label: 'Casual',
    message: 'Hai pii, aku (nama) lagi free nggak ? bisa bantuin aku project (...) ? kalau bisa kabarin yaa.',
  },
  formal: {
    label: 'Formal',
    message: 'Halo min, saya (nama) dari (perusahaan/institusi). Saya tertarik dengan portofolio Anda dan ingin mendiskusikan peluang kolaborasi untuk project (nama project). Apakah Anda tersedia untuk membahas lebih lanjut? Terima kasih.',
  },
};

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messageType, setMessageType] = useState<'casual' | 'formal'>('casual');

  const handleSendMessage = () => {
    const message = MESSAGES[messageType].message;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mb-3 bg-background rounded-2xl shadow-lg border border-border overflow-hidden w-72"
          >
            <div className="p-4 border-b border-border bg-muted/50">
              <p className="text-sm font-medium text-foreground">Hubungi via WhatsApp</p>
              <p className="text-xs text-muted-foreground mt-1">Pilih jenis pesan:</p>
            </div>
            
            <div className="p-3 space-y-2">
              <button
                onClick={() => setMessageType('casual')}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  messageType === 'casual'
                    ? 'bg-green-500/10 border-2 border-green-500'
                    : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                }`}
              >
                <p className="text-sm font-medium text-foreground">😊 Casual</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {MESSAGES.casual.message}
                </p>
              </button>

              <button
                onClick={() => setMessageType('formal')}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  messageType === 'formal'
                    ? 'bg-green-500/10 border-2 border-green-500'
                    : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                }`}
              >
                <p className="text-sm font-medium text-foreground">💼 Formal</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {MESSAGES.formal.message}
                </p>
              </button>
            </div>

            <div className="p-3 pt-0">
              <Button
                onClick={handleSendMessage}
                className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Kirim Pesan
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg bg-green-500 hover:bg-green-600 text-white"
          size="icon"
          aria-label="Chat WhatsApp"
        >
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}
