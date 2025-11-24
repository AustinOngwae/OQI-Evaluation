import React, { useState, useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { X, Check, PlayCircle } from 'lucide-react';

const AppTutorial = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if tutorial has been seen
    const tutorialSeen = localStorage.getItem('oqi_tutorial_seen');
    if (!tutorialSeen) {
      // Small delay to ensure page load
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const markAsSeen = () => {
    localStorage.setItem('oqi_tutorial_seen', 'true');
    setShowPrompt(false);
  };

  const startTour = () => {
    setShowPrompt(false);
    
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: false,
      doneBtnText: 'Finish',
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      // Disable interaction with the highlighted element to prevent accidental clicks
      onHighlightStarted: (element) => {
        if (element) {
          element.style.pointerEvents = 'none';
        }
      },
      // Re-enable interaction when moving to next step
      onDeselected: (element) => {
        if (element) {
          element.style.pointerEvents = 'auto';
        }
      },
      // Use correct v1 hook name (onDestroyed instead of onDestroy)
      onDestroyed: () => {
        // Safety: ensure all potential targets are re-enabled if onDeselected didn't fire
        document.querySelectorAll('.driver-active-element').forEach(el => {
            el.style.pointerEvents = 'auto';
        });
        markAsSeen();
      },
      steps: [
        { 
          element: '#home-intro', 
          popover: { 
            title: 'Welcome to OQI Evaluation Tool', 
            description: 'This platform is your central hub for evaluating the Open Quantum Initiative. Let us show you around!', 
            side: "bottom", 
            align: 'start' 
          } 
        },
        { 
          element: '#card-evaluation', 
          popover: { 
            title: 'Start Evaluation', 
            description: 'Click here to begin the questionnaire. You will answer a series of questions to generate a comprehensive evaluation report for your project.', 
            side: "top" 
          } 
        },
        { 
          element: '#card-editor', 
          popover: { 
            title: 'Evaluation Editor', 
            description: 'Want to improve the questions? Use the Editor to review the current criteria and suggest changes or add new resources.', 
            side: "top" 
          } 
        },
        { 
          element: '#card-admin', 
          popover: { 
            title: 'Admin Dashboard', 
            description: 'For administrators: Manage submissions, review suggestions, analyze data, and export reports (Word/CSV) from here.', 
            side: "top" 
          } 
        },
        { 
          element: '#home-intro', 
          popover: { 
            title: 'You are all set!', 
            description: 'You can now start using the application. Enjoy!', 
            side: "bottom", 
            align: 'start' 
          } 
        }
      ]
    });

    driverObj.drive();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="glass-card p-6 max-w-md w-full text-center border-2 border-brand-primary/50 shadow-[0_0_30px_rgba(75,192,192,0.3)] animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-brand-primary/20 rounded-full">
            <PlayCircle size={48} className="text-brand-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 font-sans">Welcome to OQI!</h2>
        <p className="text-gray-300 mb-6 font-body">
          It looks like it's your first time here. Would you like a quick interactive tour to learn how to use the features?
        </p>
        <div className="flex gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={markAsSeen}
            className="border-white/20 hover:bg-white/10 text-gray-300"
          >
            <X size={18} className="mr-2" /> No, thanks
          </Button>
          <Button 
            onClick={startTour}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white"
          >
            <Check size={18} className="mr-2" /> Yes, start tutorial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppTutorial;