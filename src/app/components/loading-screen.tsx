import { motion, useMotionTemplate, useMotionValue, animate } from 'motion/react';
import { useEffect } from 'react';
import logo from '../../assets/Logo_Ravnx.png';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const opacity = useMotionValue(1);
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);

  useEffect(() => {
    const sequence = async () => {
      await new Promise(r => setTimeout(r, 1500));
      
      animate(scale, 0.8, { duration: 0.3 });
      animate(opacity, 0, { duration: 0.4 });
      
      await new Promise(r => setTimeout(r, 500));
      onComplete?.();
    };
    
    sequence();
    
    const interval = setInterval(() => {
      animate(rotate, rotate.get() + 360, { duration: 2, ease: "linear" });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [onComplete, opacity, rotate, scale]);

  const imageOpacity = useMotionTemplate`${opacity}`;
  const imageScale = useMotionTemplate`${scale}`;
  const imageRotate = useMotionTemplate`${rotate}deg`;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          style={{ 
            opacity: imageOpacity, 
            scale: imageScale,
            rotate: imageRotate
          }}
        >
          <img 
            src={logo} 
            alt="Loading" 
            className="h-16 w-16 object-contain"
          />
        </motion.div>
        
        <div className="flex flex-col items-center gap-2">
          <motion.div
            className="flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ 
                  scale: [1, 1.5, 1],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  duration: 0.6, 
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
          
          <motion.p
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading...
          </motion.p>
        </div>
      </div>
      
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: useMotionTemplate`
            radial-gradient(circle at 50% 50%, 
              rgba(99, 102, 241, 0.1) 0%, 
              transparent 50%
            )
          `
        }}
        animate={{
          background: [
            'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)'
          ]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        </motion.div>
        <p className="text-muted-foreground text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
