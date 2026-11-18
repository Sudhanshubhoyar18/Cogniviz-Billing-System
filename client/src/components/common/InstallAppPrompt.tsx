import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallAppPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    return localStorage.getItem('cogniviz_app_banner_dismissed') === 'true';
  });

  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = isIos || isAndroid;

  useEffect(() => {
    // Check if app is already running as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // For desktop Chrome / Edge or other browsers without active prompt
      alert(
        'To install Cogniviz App:\n1. Click the Install icon in your browser address bar (top right)\nOR\n2. Open browser menu (⋮) -> Install Cogniviz Billing.'
      );
    }
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('cogniviz_app_banner_dismissed', 'true');
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Mobile Floating Bottom Banner */}
      {!bannerDismissed && (
        <div className="fixed bottom-3 left-3 right-3 z-40 md:hidden animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 p-1 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src="/icon-192.png"
                  alt="App Icon"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Install Cogniviz App</p>
                <p className="text-[10px] text-slate-300 truncate">
                  Direct install to phone home screen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={dismissBanner}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Instruction Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-slate-800 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Install on iPhone</h3>
                  <p className="text-[11px] text-slate-500">Fast 2-step setup</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 mb-5">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    Tap the Share button <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                  </p>
                  <p className="text-[11px] text-slate-500">Located at the bottom of Safari</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    Select "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" />
                  </p>
                  <p className="text-[11px] text-slate-500">Tap "Add" in the top right corner</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all text-center"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const SidebarInstallButton: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      alert(
        'To install Cogniviz App on your device:\n1. Click the Install icon in the right side of the address bar\nOR\n2. Open browser menu (⋮) -> Install Cogniviz Billing.'
      );
    }
  };

  if (isInstalled) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200/80 ${
          collapsed ? 'justify-center' : ''
        }`}
        title="App Installed"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        {!collapsed && <span className="text-[11px] font-semibold">App Installed</span>}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-xl transition-all shadow-sm active:scale-[0.98] ${
          collapsed ? 'justify-center' : ''
        }`}
        title="Install Mobile & Desktop App"
      >
        <Smartphone className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
        {!collapsed && (
          <div className="flex flex-col text-left truncate">
            <span className="truncate">Download Phone App</span>
            <span className="text-[9px] font-normal text-blue-600/80 truncate">1-Tap Direct Install</span>
          </div>
        )}
      </button>

      {/* iOS Modal fallback */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-slate-800 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 mb-2">Install on iOS</h3>
            <p className="text-xs text-slate-600 mb-4">
              Tap the <strong>Share</strong> button at the bottom of Safari, then select <strong>Add to Home Screen</strong>.
            </p>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

