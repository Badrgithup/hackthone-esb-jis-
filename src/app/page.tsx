"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, XCircle, Camera, Bell, TrendingUp, Map as MapIcon, LayoutDashboard, ChevronRight, Clock, RefreshCw } from 'lucide-react';

const TacticalMap = dynamic(() => import('@/components/TacticalMap'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map'>('dashboard');
  const [activeAlert, setActiveAlert] = useState<boolean>(false);
  const [showPrediction, setShowPrediction] = useState<boolean>(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState<boolean>(false);
  
  // Real ESP32 camera image path - keeps the last photo received
  const [liveImageUrl, setLiveImageUrl] = useState<string>("/live-alert.jpg");
  const [lastCaptureTime, setLastCaptureTime] = useState<string | null>(null);
  const [lastImageSize, setLastImageSize] = useState<number | null>(null);

  // Use a ref to keep track of the latest known timestamp across polling cycles
  const lastTimestampRef = useRef<number>(0);
  const isInitialMountRef = useRef<boolean>(true);

  // Continuous fetching loop: keep last photo and poll until another arrives
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`/status.json?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.timestamp) {
            // First time loading: retain and show the last received photo from storage
            if (isInitialMountRef.current) {
              isInitialMountRef.current = false;
              lastTimestampRef.current = data.timestamp;
              setLiveImageUrl(`${data.image || '/live-alert.jpg'}?t=${data.timestamp}`);
              setLastCaptureTime(new Date(data.timestamp).toLocaleTimeString());
              if (data.meta?.imageSize) setLastImageSize(data.meta.imageSize);
              console.log("[ESP32] 📷 Dernière photo chargée:", data.timestamp);
            } 
            // When a brand new photo arrives from the ESP32
            else if (data.timestamp > lastTimestampRef.current) {
              console.log("[ESP32] 📷 NOUVELLE PHOTO reçue à", data.timestamp);
              lastTimestampRef.current = data.timestamp;
              setLiveImageUrl(`${data.image || '/live-alert.jpg'}?t=${data.timestamp}`);
              setLastCaptureTime(new Date(data.timestamp).toLocaleTimeString());
              if (data.meta?.imageSize) setLastImageSize(data.meta.imageSize);
              setHasUnreadNotification(true);
              setActiveAlert(true); // Automatically open and highlight the latest photo
            }
          }
        }
      } catch {
        // Polling gracefully handles transient network drops
      }
    };

    // Initial immediate fetch on load
    pollStatus();

    // Keep fetching continuously every 1.5 seconds until another photo arrives
    const interval = setInterval(pollStatus, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = () => {
    setHasUnreadNotification(false);
    setActiveTab('map');
    setActiveAlert(true);
    setShowPrediction(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-red-500/30">
       <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 border-r border-slate-800 pr-6">
                 <ShieldAlert className="text-red-500 w-6 h-6"/>
                 <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black tracking-widest text-slate-100">SENTINELLE</h1>
                    {/* HIDDEN DEMO TRIGGER BUTTON */}
                    <button 
                       type="button"
                       onClick={() => {
                          const now = Date.now();
                          lastTimestampRef.current = now;
                          setLiveImageUrl('/live-alert.jpg?t=' + now);
                          setLastCaptureTime(new Date(now).toLocaleTimeString());
                          setHasUnreadNotification(true);
                          setActiveAlert(true);
                       }} 
                       className="w-2 h-2 rounded-full bg-slate-900 hover:bg-red-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
                       title="Rafraîchir manuellement"
                       aria-label="Rafraîchir manuellement"
                    />
                 </div>
             </div>
             <div className="flex gap-2">
                 <button 
                   type="button"
                   onClick={() => setActiveTab('dashboard')} 
                   className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold transition-colors active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
                 >
                    <LayoutDashboard className="w-4 h-4"/> TABLEAU DE BORD
                 </button>
                 <button 
                   type="button"
                   onClick={() => setActiveTab('map')} 
                   className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold transition-colors active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${activeTab === 'map' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
                 >
                    <MapIcon className="w-4 h-4"/> CARTE TACTIQUE
                 </button>
             </div>
          </div>
          <div className="flex gap-6 text-xs font-mono font-bold text-slate-400">
             <div className="flex items-center gap-2 text-green-400"><Activity className="w-4 h-4"/> 142/150 ACTIFS</div>
             <div className={`flex items-center gap-2 ${hasUnreadNotification ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                 <Camera className="w-4 h-4"/> {hasUnreadNotification ? "1 NOUVELLE PHOTO" : "SURVEILLANCE CONTINUE"}
             </div>
          </div>
       </header>

       <div className="flex flex-1 overflow-hidden relative bg-[#0a0a0a]">
          {activeTab === 'dashboard' && (
             <div className="flex-1 p-8 overflow-y-auto animate-in fade-in duration-300">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><LayoutDashboard className="text-slate-500"/> VUE D'ENSEMBLE DU RÉSEAU</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Left column: Notifications & Status */}
                   <div className="flex flex-col gap-6">
                      <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-slate-500"/> CENTRE DE NOTIFICATIONS</h3>
                        
                        <div className="flex flex-col gap-3">
                           {!hasUnreadNotification ? (
                              <div className="bg-slate-900/20 border border-slate-800/50 p-6 rounded-lg flex flex-col items-center justify-center text-slate-500 font-mono text-sm">
                                 <Activity className="w-8 h-8 mb-2 opacity-50"/>
                                 Réseau sous surveillance. La dernière photo reçue est conservée.
                              </div>
                           ) : (
                              <div 
                                onClick={handleNotificationClick} 
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(); }}
                                className="bg-red-950/20 border border-red-500 p-4 rounded-lg cursor-pointer hover:bg-red-900/30 transition-all group flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                              >
                                 <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                                    <div>
                                       <div className="text-red-500 font-bold text-sm">NOUVELLE PHOTO REÇUE DE L'ESP32-CAM</div>
                                       <div className="text-slate-400 text-xs font-mono mt-1">Cliquer pour localiser sur la carte tactique</div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <span className="text-red-400/60 text-[10px] font-mono">À L'INSTANT</span>
                                    <ChevronRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-transform"/>
                                 </div>
                              </div>
                           )}
                        </div>
                      </div>

                      {/* Connection Details Box */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 font-mono text-xs text-slate-400 space-y-2.5">
                         <div className="text-slate-300 font-bold mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-400 animate-spin" /> ÉCOUTE MATÉRIELLE DIRECTE</span>
                            <span className="text-green-400 text-[11px] bg-green-950/60 border border-green-800/60 px-2 py-0.5 rounded">ACTIF</span>
                         </div>
                         <div className="flex justify-between border-b border-slate-800/60 pb-2">
                            <span>Capteur source:</span>
                            <span className="text-slate-200">ESP32-CAM (Direct)</span>
                         </div>
                         <div className="flex justify-between border-b border-slate-800/60 pb-2">
                            <span>Dernière capture:</span>
                            <span className="text-slate-200">{lastCaptureTime ? lastCaptureTime : "En attente"}</span>
                         </div>
                         <div className="flex justify-between">
                            <span>Mode:</span>
                            <span className="text-blue-400">Conservation du cliché & veille continue</span>
                         </div>
                      </div>
                   </div>

                   {/* Right column: Direct photo from ESP32 */}
                   <div>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Camera className="w-5 h-5 text-slate-500"/> PHOTO EN DIRECT (ESP32-CAM)</h3>
                      <div className="border border-slate-800 bg-black rounded-lg overflow-hidden flex flex-col shadow-2xl">
                         <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-300 font-bold flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                               CLICHÉ ESP32 EN TEMPS RÉEL
                            </span>
                            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                               <Clock className="w-3.5 h-3.5"/>
                               {lastCaptureTime || "En veille"}
                            </span>
                         </div>
                         <div className="p-3 flex items-center justify-center bg-black min-h-[340px]">
                            <img 
                              src={liveImageUrl} 
                              alt="Photo ESP32-CAM" 
                              className="w-full h-auto object-contain max-h-[420px] rounded"
                              onError={() => {
                                console.error("Hardware feed error: Failed to decode /live-alert.jpg from ESP32.");
                              }}
                            />
                         </div>
                         <div className="p-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span>Fichier: /live-alert.jpg</span>
                            {lastImageSize && <span>Taille: {lastImageSize} octets</span>}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'map' && (
             <>
                <main className="flex-1 relative bg-[#1a1a1a] animate-in fade-in duration-300">
                   <TacticalMap 
                     activeAlert={activeAlert} 
                     showPrediction={showPrediction}
                     onNodeClick={() => setActiveAlert(true)} 
                   />
                </main>

                {activeAlert && (
                   <aside className="w-full md:w-[440px] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800/80 flex flex-col shrink-0 shadow-2xl z-10 animate-in slide-in-from-right-8 duration-300">
                      <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-red-950/30 to-transparent">
                         <div className="flex justify-between items-center">
                            <h2 className="text-slate-100 font-bold text-base flex items-center gap-2">
                               <Camera className="w-5 h-5 text-red-500"/> PHOTO DIRECTE ESP32-CAM
                            </h2>
                            <button 
                              type="button"
                              onClick={() => { setActiveAlert(false); }} 
                              aria-label="Fermer le panneau"
                              className="text-slate-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded"
                            >
                               <XCircle className="w-5 h-5"/>
                            </button>
                         </div>
                      </div>

                      <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
                         {/* Direct photo display without filter or decision overlays */}
                         <div className="border border-slate-800 bg-black rounded-lg overflow-hidden flex flex-col shadow-xl">
                            <div className="p-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                               <span className="text-green-400 flex items-center gap-1.5 font-bold">
                                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                  FLUX CAPTEUR DIRECT
                               </span>
                               <span className="text-slate-400 text-[11px]">{lastCaptureTime || "En direct"}</span>
                            </div>
                            <div className="p-2 bg-black flex items-center justify-center min-h-[260px]">
                               <img 
                                 src={liveImageUrl} 
                                 alt="Photo directe ESP32" 
                                 className="w-full h-auto object-contain max-h-[420px] rounded" 
                                 onError={() => {
                                   console.error("Hardware feed error: Failed to decode /live-alert.jpg from ESP32.");
                                 }}
                               />
                            </div>
                         </div>
                         
                         {!showPrediction ? (
                            <button 
                              type="button"
                              onClick={() => setShowPrediction(true)} 
                              className="w-full bg-red-600 hover:bg-red-700 text-white font-mono font-bold py-3 rounded transition-all active:scale-[0.96] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                            >
                               PRÉDIRE LA TRAJECTOIRE
                            </button>
                         ) : (
                            <div className="bg-orange-950/40 border border-orange-500/50 p-4 rounded text-orange-400 font-mono text-xs animate-in fade-in slide-in-from-top-2">
                               <div className="font-bold mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> TRAJECTOIRE CALCULÉE</div>
                               Probabilité d'interception maximale: Nœud 46 (Tataouine Sud). Patrouille déployée.
                            </div>
                         )}
                      </div>
                   </aside>
                )}
             </>
          )}
       </div>
    </div>
  );
}
