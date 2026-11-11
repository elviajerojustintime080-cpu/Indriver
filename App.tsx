import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Navigation, Car, User, ShieldCheck, MapPin, 
  Send, Phone, MessageSquare, Share2, Award, 
  Compass, WifiOff, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { RutaMap } from './components/RutaMap';
import { sound } from './utils/soundEngine';
import { EXACT_DESTINATIONS, TOURIST_ZONES, SAVED_LOCALITIES, LocationItem } from './data/locations';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'tu-anon-key';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function App() {
  const [roleMode, setRoleMode] = useState<'passenger' | 'driver'>(() => {
    return (localStorage.getItem('rc_role') as 'passenger' | 'driver') || 'passenger';
  });

  const [passengerTab, setPassengerTab] = useState<'inicio' | 'viajes' | 'zonas' | 'cuenta' | 'compartido'>('inicio');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [origin, setOrigin] = useState<LocationItem>(EXACT_DESTINATIONS[0]);
  const [dest, setDest] = useState<LocationItem>(EXACT_DESTINATIONS[1]);
  const [category, setCategory] = useState<'moto' | 'economico' | 'confort' | 'xl'>('economico');
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [sharedRideCode, setSharedRideCode] = useState('');
  const [trackedSharedRide, setTrackedSharedRide] = useState<any>(null);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>({
    clabe_number: '012840000000000000',
    bank_name: 'BBVA México',
    account_holder: 'Administración Ruta Costa'
  });

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); sound.play('senal_recuperada'); };
    const handleOffline = () => { setIsOnline(false); sound.play('senal_perdida'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const changeRoleMode = (mode: 'passenger' | 'driver') => {
    setRoleMode(mode);
    localStorage.setItem('rc_role', mode);
  };

  const requestGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Este dispositivo o navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setGpsError(null);
        setOrigin({
          id: 'user_gps',
          name: 'Mi Ubicación Actual',
          locality: 'San Andrés Tuxtla',
          lat: coords.lat,
          lng: coords.lng
        });
      },
      () => {
        setGpsError('Sin GPS: Permiso no otorgado o satélites no disponibles.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const calculateFare = (cat: string) => {
    const basePrices = { moto: 18.0, economico: 22.0, confort: 28.0, xl: 35.0 };
    const perKm = { moto: 5.0, economico: 7.25, confort: 9.5, xl: 12.0 };
    
    const dist = Math.sqrt(
      Math.pow((dest.lat - origin.lat) * 111, 2) + 
      Math.pow((dest.lng - origin.lng) * 111 * Math.cos(origin.lat * Math.PI / 180), 2)
    );
    const calculated = (basePrices as any)[cat] + (dist * (perKm as any)[cat]);
    return Number(calculated.toFixed(2));
  };

  const requestRide = async () => {
    if (!isOnline) {
      alert('Sin señal: No es posible solicitar viajes nuevos en modo offline.');
      return;
    }
    const fare = calculateFare(category);
    const commission = Number((fare * 0.10).toFixed(2));
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const newRideData = {
      share_code: shareCode,
      passenger_name: 'Pasajero Local',
      passenger_phone: '2941000000',
      origin_name: origin.name,
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      dest_name: dest.name,
      dest_lat: dest.lat,
      dest_lng: dest.lng,
      category,
      fare,
      commission,
      boarding_pin: randomPin,
      status: 'buscando_conductor',
      passenger_lat: userCoords?.lat || origin.lat,
      passenger_lng: userCoords?.lng || origin.lng
    };

    const { data, error } = await supabase.from('rides').insert([newRideData]).select().single();
    if (error) {
      alert('Error al conectar con la central de viajes.');
      return;
    }

    setCurrentRide(data);
    sound.play('nuevo_viaje');
  };

  useEffect(() => {
    if (!currentRide?.id) return;

    const channel = supabase
      .channel(`ride_${currentRide.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${currentRide.id}` }, (payload) => {
        setCurrentRide(payload.new);
        sound.play(payload.new.status);
      })
      .subscribe();

    const msgChannel = supabase
      .channel(`chat_${currentRide.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ride_messages', filter: `ride_id=eq.${currentRide.id}` }, (payload) => {
        setChatMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(msgChannel);
    };
  }, [currentRide?.id]);

  const handleSearchStreet = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text + ', Veracruz, Mexico')}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      const matched = SAVED_LOCALITIES.filter(l => l.toLowerCase().includes(text.toLowerCase())).map(m => ({
        display_name: `${text}, ${m}, Veracruz`,
        lat: 18.44849,
        lon: -95.21204
      }));
      setSearchResults(matched);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#ece2c9] text-stone-900 font-sans overflow-hidden">
      <header className="bg-[#0e2617] text-white p-3 shadow-md z-30 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-800 border border-emerald-400 flex items-center justify-center overflow-hidden">
              <svg className="w-6 h-6 text-emerald-200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2-4.5-6L1 18h22L14 6z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-emerald-300">RUTA COSTA</h1>
              <p className="text-[10px] text-stone-300 -mt-1">San Andrés Tuxtla & Región de Los Tuxtlas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="flex items-center gap-1 text-[11px] bg-red-600 px-2 py-0.5 rounded text-white font-medium">
                <WifiOff className="w-3 h-3" /> Sin Señal
              </span>
            )}
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="p-1.5 bg-emerald-950/80 rounded border border-emerald-600/40 text-emerald-300"
              title="Panel Admin"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-black/30 rounded-lg text-xs font-semibold">
          <button
            onClick={() => changeRoleMode('passenger')}
            className={`py-2 rounded-md transition ${roleMode === 'passenger' ? 'bg-emerald-600 text-white shadow' : 'text-stone-300 hover:text-white'}`}
          >
            Pasajero: pedir viajes
          </button>
          <button
            onClick={() => changeRoleMode('driver')}
            className={`py-2 rounded-md transition ${roleMode === 'driver' ? 'bg-emerald-600 text-white shadow' : 'text-stone-300 hover:text-white'}`}
          >
            Conductor: recibir y ganar
          </button>
        </div>
      </header>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {roleMode === 'passenger' && (
          <div className="flex-1 flex flex-col h-full relative">
            {passengerTab === 'inicio' && (
              <div className="flex-1 flex flex-col relative h-full">
                <div className="flex-1 w-full relative">
                  <RutaMap 
                    origin={origin} 
                    dest={dest} 
                    userLoc={userCoords}
                  />

                  <button 
                    onClick={requestGPS}
                    className="absolute top-3 right-3 z-20 bg-white/95 text-stone-900 px-3 py-2 rounded-full shadow-lg border border-stone-200 flex items-center gap-2 text-xs font-bold"
                  >
                    <Compass className="w-4 h-4 text-emerald-700 animate-spin-slow" />
                    {userCoords ? 'GPS Listo' : 'Usar mi ubicación real'}
                  </button>

                  {gpsError && (
                    <div className="absolute top-14 right-3 z-20 bg-amber-100 text-amber-900 text-[11px] p-2 rounded shadow max-w-[200px]">
                      {gpsError}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-t-2xl shadow-2xl p-4 z-20 border-t border-stone-200 max-h-[50vh] overflow-y-auto">
                  {!currentRide ? (
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <label className="text-[11px] font-bold text-stone-500 uppercase">Escribir destino en Veracruz</label>
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => handleSearchStreet(e.target.value)}
                          placeholder="Calle, avenida o localidad..." 
                          className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-emerald-600"
                        />
                        {searchResults.length > 0 && (
                          <div className="absolute left-0 right-0 top-14 bg-white border border-stone-200 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                            {searchResults.map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setDest({
                                    id: `search_${idx}`,
                                    name: item.display_name.split(',')[0],
                                    locality: 'Veracruz',
                                    lat: parseFloat(item.lat),
                                    lng: parseFloat(item.lon)
                                  });
                                  setSearchResults([]);
                                }}
                                className="w-full text-left p-2 border-b border-stone-100 hover:bg-emerald-50 text-xs"
                              >
                                <p className="font-semibold">{item.display_name.split(',')[0]}</p>
                                <p className="text-[10px] text-stone-500">Localidad: {item.display_name}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800">ORIGEN:</span>
                          <select 
                            value={origin.id} 
                            onChange={(e) => setOrigin(EXACT_DESTINATIONS.find(d => d.id === e.target.value) || EXACT_DESTINATIONS[0])}
                            className="w-full text-xs p-2 rounded border border-stone-300 bg-white"
                          >
                            {EXACT_DESTINATIONS.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-red-700">DESTINO:</span>
                          <select 
                            value={dest.id} 
                            onChange={(e) => setDest(EXACT_DESTINATIONS.find(d => d.id === e.target.value) || EXACT_DESTINATIONS[1])}
                            className="w-full text-xs p-2 rounded border border-stone-300 bg-white"
                          >
                            {EXACT_DESTINATIONS.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1 py-1">
                        {[
                          { id: 'moto', label: 'Moto', icon: '🛵' },
                          { id: 'economico', label: 'Económico', icon: '🚗' },
                          { id: 'confort', label: 'Confort', icon: '✨' },
                          { id: 'xl', label: 'XL Familiar', icon: '🚐' }
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id as any)}
                            className={`flex flex-col items-center p-2 rounded-lg border text-center transition ${category === cat.id ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold' : 'border-stone-200'}`}
                          >
                            <span className="text-lg">{cat.icon}</span>
                            <span className="text-[11px] mt-1">{cat.label}</span>
                            <span className="text-[10px] text-emerald-800 font-extrabold mt-0.5">${calculateFare(cat.id)}</span>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={requestRide}
                        className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                      >
                        <Car className="w-5 h-5" />
                        Pedir Viaje Ahora (${calculateFare(category)} MXN)
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400">Estado del viaje</span>
                          <h4 className="text-base font-bold text-emerald-900 capitalize">{currentRide.status.replace(/_/g, ' ')}</h4>
                        </div>
                        <div className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-3 py-1 rounded-lg text-center">
                          <span className="text-[9px] block font-bold uppercase">PIN de abordaje</span>
                          <span className="text-lg font-black tracking-widest">{currentRide.boarding_pin}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-stone-100 p-2 rounded-lg">
                        <div className="text-xs">
                          <span className="text-stone-500">Código para compartir en vivo:</span>
                          <p className="font-mono font-bold text-stone-800">{currentRide.share_code}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: 'Sigue mi viaje en Ruta Costa',
                                text: `Sigue mi viaje en tiempo real con este código: ${currentRide.share_code}`,
                                url: window.location.href
                              });
                            } else {
                              navigator.clipboard.writeText(currentRide.share_code);
                              alert('Código de 8 letras copiado al portapapeles');
                            }
                          }}
                          className="bg-white border border-stone-300 p-2 rounded-lg text-xs flex items-center gap-1 font-semibold"
                        >
                          <Share2 className="w-4 h-4 text-emerald-700" /> Compartir
                        </button>
                      </div>

                      <div className="mt-2 flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-stone-500">Chat con Conductor</span>
                        <div className="bg-stone-50 border border-stone-200 rounded-lg p-2 h-24 overflow-y-auto flex flex-col gap-1 text-xs">
                          {chatMessages.length === 0 ? (
                            <p className="text-stone-400 text-center italic mt-6">Sin mensajes aún. Escribe para coordinar el abordaje.</p>
                          ) : (
                            chatMessages.map((msg, i) => (
                              <div key={i} className={`p-1.5 rounded max-w-[80%] ${msg.sender_type === 'passenger' ? 'bg-emerald-100 self-end text-emerald-950' : 'bg-white border self-start text-stone-800'}`}>
                                <p className="text-[11px]">{msg.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-1">
                          <input 
                            type="text" 
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Mensaje al conductor..."
                            className="flex-1 text-xs p-2 rounded-lg border border-stone-300 bg-white"
                          />
                          <button
                            onClick={async () => {
                              if (!inputMessage.trim()) return;
                              await supabase.from('ride_messages').insert([{
                                ride_id: currentRide.id,
                                sender_type: 'passenger',
                                message: inputMessage
                              }]);
                              setInputMessage('');
                            }}
                            className="bg-emerald-800 text-white px-3 rounded-lg flex items-center justify-center"
                          >
                            <Send className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          await supabase.from('rides').update({ status: 'viaje_cancelado' }).eq('id', currentRide.id);
                          setCurrentRide(null);
                          sound.play('viaje_cancelado');
                        }}
                        className="w-full mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold py-2 rounded-xl text-xs transition"
                      >
                        Cancelar Viaje
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {passengerTab === 'zonas' && (
              <div className="flex-1 p-4 overflow-y-auto bg-stone-100 flex flex-col gap-3">
                <h3 className="font-bold text-base text-emerald-950 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-700"/> Guía Turística de Los Tuxtlas
                </h3>
                <p className="text-xs text-stone-600">Explora los mejores destinos naturales y selecciona cualquiera para establecerlo como tu destino de viaje de inmediato.</p>
                
                <div className="grid grid-cols-1 gap-3">
                  {TOURIST_ZONES.map((zone) => (
                    <div key={zone.id} className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">{zone.bestTime}</span>
                          <h4 className="font-bold text-sm text-stone-900 mt-1">{zone.name}</h4>
                          <p className="text-xs text-stone-600">{zone.title}</p>
                        </div>
                        <button
                          onClick={() => {
                            setDest({
                              id: zone.id,
                              name: zone.name,
                              locality: 'Los Tuxtlas',
                              lat: zone.coords.lat,
                              lng: zone.coords.lng
                            });
                            setPassengerTab('inicio');
                            sound.play('recarga_confirmada');
                          }}
                          className="bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow hover:bg-emerald-900"
                        >
                          Ir Aquí
                        </button>
                      </div>
                      <div className="bg-stone-50 p-2 rounded text-[11px] text-stone-700 flex flex-col gap-1 border border-stone-100">
                        <p><strong>Qué hacer:</strong> {zone.todo}</p>
                        <p className="text-emerald-900"><strong>Recomendación:</strong> {zone.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {passengerTab === 'compartido' && (
              <div className="flex-1 p-4 bg-stone-100 flex flex-col gap-4">
                <h3 className="font-bold text-base text-emerald-950 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-700"/> Rastrear Viaje Compartido
                </h3>
                <p className="text-xs text-stone-600">Introduce el código de 8 letras que te compartió un familiar o amigo para seguir su trayecto en tiempo real.</p>
                
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-3">
                  <input 
                    type="text"
                    value={sharedRideCode}
                    onChange={(e) => setSharedRideCode(e.target.value.toUpperCase())}
                    placeholder="Ej. AB12CD34"
                    className="p-3 text-sm font-mono uppercase tracking-widest text-center border rounded-lg border-stone-300"
                  />
                  <button
                    onClick={async () => {
                      if (!sharedRideCode) return;
                      const { data, error } = await supabase.from('rides').select('*').eq('share_code', sharedRideCode).single();
                      if (error || !data) {
                        alert('Viaje no encontrado con ese código.');
                        return;
                      }
                      setTrackedSharedRide(data);
                    }}
                    className="bg-emerald-800 text-white font-bold py-2.5 rounded-lg text-xs"
                  >
                    Buscar Viaje en Vivo
                  </button>
                </div>

                {trackedSharedRide && (
                  <div className="bg-white p-4 rounded-xl border border-emerald-300 shadow-md flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Estado actual del viaje</span>
                    <h4 className="font-bold text-sm text-stone-900 capitalize">{trackedSharedRide.status.replace(/_/g, ' ')}</h4>
                    <p className="text-xs text-stone-600"><strong>Origen:</strong> {trackedSharedRide.origin_name}</p>
                    <p className="text-xs text-stone-600"><strong>Destino:</strong> {trackedSharedRide.dest_name}</p>
                    <div className="h-48 w-full mt-2 rounded-lg overflow-hidden border">
                      <RutaMap origin={{ lat: trackedSharedRide.origin_lat, lng: trackedSharedRide.origin_lng }} dest={{ lat: trackedSharedRide.dest_lat, lng: trackedSharedRide.dest_lng }} interactive={false} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {passengerTab === 'cuenta' && (
              <div className="flex-1 p-4 bg-stone-100 flex flex-col gap-4">
                <h3 className="font-bold text-base text-emerald-950">Mi Cuenta Pasajero</h3>
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-3 text-xs">
                  <div className="flex items-center gap-3 border-b pb-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-lg">
                      PL
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Pasajero Local</h4>
                      <p className="text-stone-500">San Andrés Tuxtla, Ver.</p>
                    </div>
                  </div>
                  <p><strong>Teléfono:</strong> 294 100 0000</p>
                  <p><strong>Viajes realizados:</strong> 14</p>
                  <p><strong>Nivel de usuario:</strong> Viajero Frecuente Costa</p>
                </div>
              </div>
            )}

            <nav className="bg-white border-t border-stone-200 grid grid-cols-5 p-2 z-30 text-stone-600 text-center text-[10px] font-semibold">
              <button onClick={() => setPassengerTab('inicio')} className={`flex flex-col items-center gap-1 ${passengerTab === 'inicio' ? 'text-emerald-700 font-bold' : ''}`}>
                <Navigation className="w-4 h-4"/> Inicio
              </button>
              <button onClick={() => setPassengerTab('zonas')} className={`flex flex-col items-center gap-1 ${passengerTab === 'zonas' ? 'text-emerald-700 font-bold' : ''}`}>
                <Compass className="w-4 h-4"/> Zonas
              </button>
              <button onClick={() => setPassengerTab('compartido')} className={`flex flex-col items-center gap-1 ${passengerTab === 'compartido' ? 'text-emerald-700 font-bold' : ''}`}>
                <Share2 className="w-4 h-4"/> Compartir
              </button>
              <button onClick={() => setPassengerTab('cuenta')} className={`flex flex-col items-center gap-1 ${passengerTab === 'cuenta' ? 'text-emerald-700 font-bold' : ''}`}>
                <User className="w-4 h-4"/> Cuenta
              </button>
              <button onClick={() => setIsAdminOpen(true)} className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4"/> Admin
              </button>
            </nav>
          </div>
        )}

        {roleMode === 'driver' && (
          <div className="flex-1 flex flex-col h-full bg-stone-100 p-4 overflow-y-auto gap-4">
            {!driverProfile ? (
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-3">
                <h3 className="font-bold text-sm text-emerald-950">Registro de Conductor Ruta Costa</h3>
                <p className="text-xs text-stone-600">Regístrate para comenzar a recibir solicitudes de viaje y recargar saldo mediante SPEI.</p>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const newDriver = {
                      device_id: 'dev_' + Math.random().toString(36).substring(2, 8),
                      full_name: formData.get('name'),
                      phone: formData.get('phone'),
                      vehicle_model: formData.get('model'),
                      license_plate: formData.get('plate'),
                      driver_license: formData.get('license'),
                      vehicle_category: formData.get('category'),
                      is_verified: true,
                      is_online: true,
                      wallet_balance: 50.00
                    };
                    const { data, error } = await supabase.from('drivers').insert([newDriver]).select().single();
                    if (error) {
                      alert('Error al registrar conductor.');
                      return;
                    }
                    setDriverProfile(data);
                    setIsDriverOnline(true);
                  }}
                  className="flex flex-col gap-2 text-xs"
                >
                  <input name="name" placeholder="Nombre completo" required className="p-2.5 border rounded-lg bg-stone-50" />
                  <input name="phone" placeholder="Teléfono de contacto" required className="p-2.5 border rounded-lg bg-stone-50" />
                  <input name="model" placeholder="Modelo de vehículo (Ej. Tsuru / Moto 150)" required className="p-2.5 border rounded-lg bg-stone-50" />
                  <input name="plate" placeholder="Placas" required className="p-2.5 border rounded-lg bg-stone-50" />
                  <input name="license" placeholder="Número de Licencia" required className="p-2.5 border rounded-lg bg-stone-50" />
                  <select name="category" className="p-2.5 border rounded-lg bg-white">
                    <option value="economico">Económico / Tsuru</option>
                    <option value="moto">Moto</option>
                    <option value="confort">Confort</option>
                    <option value="xl">XL Familiar</option>
                  </select>
                  <button type="submit" className="bg-emerald-800 text-white font-bold py-3 rounded-lg mt-2">
                    Completar Registro y Conectar
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">{driverProfile.full_name}</h3>
                    <p className="text-[11px] text-stone-500">Vehículo: {driverProfile.vehicle_model} ({driverProfile.license_plate})</p>
                    <p className="text-xs font-bold text-emerald-800 mt-1">Saldo en Billetera: ${driverProfile.wallet_balance} MXN</p>
                  </div>
                  <button
                    onClick={() => setIsDriverOnline(!isDriverOnline)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs shadow ${isDriverOnline ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                  >
                    {isDriverOnline ? 'En Línea' : 'Desconectado'}
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-2 text-xs">
                  <h4 className="font-bold text-emerald-950">Recargar Saldo (Comisión 10%)</h4>
                  <p className="text-[11px] text-stone-600">Transfiere a la CLABE institucional <strong>{systemSettings.clabe_number}</strong> ({systemSettings.bank_name}) y reporta tu referencia.</p>
                  <button 
                    onClick={async () => {
                      const ref = prompt('Ingresa tu número de referencia SPEI de pago:');
                      if (!ref) return;
                      await supabase.from('recharges').insert([{
                        driver_id: driverProfile.id,
                        amount: 100.00,
                        reference: ref,
                        status: 'pendiente'
                      }]);
                      alert('Recarga reportada a administración con éxito.');
                    }}
                    className="bg-stone-900 text-white font-bold py-2 rounded-lg mt-1"
                  >
                    Reportar Recarga de $100 MXN
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <h4 className="font-bold text-xs text-stone-700 uppercase">Viajes Disponibles en la Región</h4>
                  <button 
                    onClick={async () => {
                      const { data } = await supabase.from('rides').select('*').eq('status', 'buscando_conductor');
                      setAvailableRides(data || []);
                    }}
                    className="bg-emerald-100 text-emerald-900 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5"/> Buscar Solicitudes Activas
                  </button>

                  {availableRides.map((ride) => (
                    <div key={ride.id} className="bg-white p-3 rounded-xl border border-emerald-300 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded uppercase">{ride.category}</span>
                        <span className="font-extrabold text-emerald-800 text-sm">${ride.fare} MXN</span>
                      </div>
                      <p className="text-xs text-stone-800"><strong>Origen:</strong> {ride.origin_name}</p>
                      <p className="text-xs text-stone-800"><strong>Destino:</strong> {ride.dest_name}</p>
                      <button
                        onClick={async () => {
                          await supabase.from('rides').update({
                            driver_id: driverProfile.id,
                            status: 'conductor_asignado'
                          }).eq('id', ride.id);
                          alert('¡Viaje aceptado con éxito!');
                          sound.play('viaje_asignado');
                        }}
                        className="bg-emerald-800 text-white font-bold py-2 rounded-lg text-xs mt-1"
                      >
                        Aceptar Viaje
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {isAdminOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700"/> Panel de Administración
              </h3>
              <button onClick={() => setIsAdminOpen(false)} className="font-bold text-stone-400 hover:text-stone-700 text-base">✕</button>
            </div>

            {!isAdminAuthenticated ? (
              <div className="flex flex-col gap-3 py-2">
                <p className="text-stone-600">Introduce el PIN de Administrador (Predeterminado: <strong>2025</strong>)</p>
                <input 
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="PIN Admin"
                  className="p-2.5 text-center tracking-widest text-base border rounded-lg"
                />
                <button
                  onClick={async () => {
                    const { data } = await supabase.from('system_settings').select('*').eq('id', 1).single();
                    if (data && (adminPin === data.admin_pin || adminPin === '2025')) {
                      setIsAdminAuthenticated(true);
                      setSystemSettings(data);
                    } else {
                      alert('PIN incorrecto');
                    }
                  }}
                  className="bg-emerald-800 text-white font-bold py-2.5 rounded-lg"
                >
                  Entrar al Panel
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <h4 className="font-bold text-emerald-900 mb-1">Configuración Bancaria SPEI</h4>
                  <label className="text-[10px] text-stone-600">CLABE Interbancaria</label>
                  <input 
                    type="text" 
                    value={systemSettings.clabe_number}
                    onChange={(e) => setSystemSettings({...systemSettings, clabe_number: e.target.value})}
                    className="w-full p-1.5 border rounded mb-2 bg-white text-xs font-mono"
                  />
                  <button 
                    onClick={async () => {
                      await supabase.from('system_settings').update({ clabe_number: systemSettings.clabe_number }).eq('id', 1);
                      alert('CLABE actualizada correctamente');
                    }}
                    className="bg-emerald-800 text-white font-bold py-1.5 px-3 rounded text-[11px]"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}