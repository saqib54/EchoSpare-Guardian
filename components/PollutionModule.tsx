import React, { useState, useRef } from 'react';
import { Wind, Trash2, Loader2, Recycle, CloudRain, AlertOctagon, Search, MapPin, Navigation, MessageCircle, Send, Gauge } from 'lucide-react';
import { analyzeImageWithGemini, getTextAdvice, getCityAirQuality, getAirQualityByCoordinates, getContextualAdvice } from '../services/geminiService';
import { AnalysisResult } from '../types';

const PollutionModule: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'monitor' | 'waste'>('monitor');

  // Monitor State
  const [monitorMode, setMonitorMode] = useState<'manual' | 'city'>('manual');
  const [city, setCity] = useState('');
  const [cityResult, setCityResult] = useState<string | null>(null);
  
  const [aqi, setAqi] = useState(120);
  const [waterPh, setWaterPh] = useState(7.2);
  const [monitorResult, setMonitorResult] = useState<string | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);

  // Inline AI Assistant State
  const [inlineQuestion, setInlineQuestion] = useState('');
  const [inlineAnswer, setInlineAnswer] = useState<string | null>(null);
  const [inlineLoading, setInlineLoading] = useState(false);

  // Waste State
  const [wasteImage, setWasteImage] = useState<string | null>(null);
  const [wasteResult, setWasteResult] = useState<AnalysisResult | null>(null);
  const [wasteLoading, setWasteLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWasteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWasteImage(reader.result as string);
        setWasteResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeWaste = async () => {
    if (!wasteImage) return;
    setWasteLoading(true);
    try {
      const prompt = `
        Analyze this waste item. 
        Identify the item.
        Categorize as 'Recyclable', 'Compostable', 'Landfill', or 'Hazardous'.
        Provide proper disposal instructions as recommendations.
        Estimate approximate carbon footprint reduction if recycled in metricLabel1/Value1.
      `;
      const data = await analyzeImageWithGemini(wasteImage, prompt);
      setWasteResult(data);
    } catch (error) {
      alert("Analysis failed.");
    } finally {
      setWasteLoading(false);
    }
  };

  const calculateImpact = async () => {
    setMonitorLoading(true);
    setInlineAnswer(null);
    try {
      const prompt = `
        Given Air Quality Index (AQI) of ${aqi} and Water pH of ${waterPh}.
        1. Rate the hazard level (Low/Medium/High).
        2. Suggest 3 immediate actions to reduce pollution or protect health.
        3. Estimate rough daily carbon footprint impact for an average individual in this environment.
      `;
      const advice = await getTextAdvice(prompt);
      setMonitorResult(advice);
    } catch (error) {
      setMonitorResult("Failed to calculate.");
    } finally {
      setMonitorLoading(false);
    }
  };

  const checkCityAirQuality = async () => {
    if (!city) return;
    setMonitorLoading(true);
    setCityResult(null);
    setInlineAnswer(null);
    try {
      const result = await getCityAirQuality(city);
      setCityResult(result);
    } catch (error) {
      setCityResult("Could not fetch data for this city.");
    } finally {
      setMonitorLoading(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setMonitorLoading(true);
    setCityResult(null);
    setInlineAnswer(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await getAirQualityByCoordinates(latitude, longitude);
          setCityResult(result);
          setCity("Current Location");
        } catch (e) {
          setCityResult("Failed to retrieve location data.");
        } finally {
          setMonitorLoading(false);
        }
      },
      (error) => {
        setMonitorLoading(false);
        alert("Unable to retrieve your location. Please allow permissions.");
      }
    );
  };

  const askInlineAI = async () => {
    if (!inlineQuestion.trim()) return;
    const context = monitorMode === 'manual' ? monitorResult : cityResult;
    if (!context) return;

    setInlineLoading(true);
    try {
      const answer = await getContextualAdvice(context, inlineQuestion);
      setInlineAnswer(answer);
    } catch (e) {
      setInlineAnswer("Sorry, I couldn't fetch an answer right now.");
    } finally {
      setInlineLoading(false);
      setInlineQuestion('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Pollution<br />Control</h2>
            <p className="text-slate-600 mt-2 font-medium">Track metrics & sort waste</p>
          </div>
          <button
            onClick={() => setActiveSection('monitor')}
            className={`w-full text-left p-4 rounded-2xl flex items-center space-x-3 transition-all duration-300 ${
              activeSection === 'monitor' 
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-200 scale-105' 
              : 'glass-panel hover:bg-white/50 text-slate-600 hover:text-slate-800'
            }`}
          >
            <Wind size={22} />
            <span className="font-semibold">Air & Water</span>
          </button>
          <button
            onClick={() => setActiveSection('waste')}
            className={`w-full text-left p-4 rounded-2xl flex items-center space-x-3 transition-all duration-300 ${
              activeSection === 'waste' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' 
              : 'glass-panel hover:bg-white/50 text-slate-600 hover:text-slate-800'
            }`}
          >
            <Recycle size={22} />
            <span className="font-semibold">Smart Sorting</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          {activeSection === 'monitor' ? (
            <div className="glass-panel rounded-3xl p-8 shadow-xl border border-white/60">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                  <AlertOctagon className="mr-3 text-teal-600" />
                  Environmental Hazard Tracker
                </h3>
                <div className="bg-slate-100/50 p-1.5 rounded-xl flex space-x-1">
                  <button
                    onClick={() => setMonitorMode('manual')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                      monitorMode === 'manual' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Manual Input
                  </button>
                  <button
                    onClick={() => setMonitorMode('city')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                      monitorMode === 'city' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Live City Data
                  </button>
                </div>
              </div>
              
              {monitorMode === 'manual' ? (
                <div className="animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white/60 p-6 rounded-2xl border border-white/50 shadow-sm">
                      <label className="flex justify-between text-sm font-bold text-slate-700 mb-4">
                        <span>Air Quality Index (AQI)</span>
                        <span className={`px-2 py-0.5 rounded text-white ${aqi > 150 ? 'bg-red-500' : 'bg-teal-500'}`}>{aqi}</span>
                      </label>
                      <input 
                        type="range" min="0" max="500" value={aqi} 
                        onChange={(e) => setAqi(Number(e.target.value))}
                        className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                      <div className="mt-3 text-xs font-semibold text-slate-400 flex justify-between">
                        <span>Good (0)</span>
                        <span>Hazardous (500)</span>
                      </div>
                    </div>

                    <div className="bg-white/60 p-6 rounded-2xl border border-white/50 shadow-sm">
                      <label className="flex justify-between text-sm font-bold text-slate-700 mb-4">
                        <span>Water pH Level</span>
                        <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">{waterPh}</span>
                      </label>
                      <input 
                        type="range" min="0" max="14" step="0.1" value={waterPh} 
                        onChange={(e) => setWaterPh(Number(e.target.value))}
                        className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="mt-3 text-xs font-semibold text-slate-400 flex justify-between">
                        <span>Acidic (0)</span>
                        <span>Alkaline (14)</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={calculateImpact}
                    disabled={monitorLoading}
                    className="w-full md:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                  >
                    {monitorLoading ? <Loader2 className="animate-spin mr-2" /> : <Gauge className="mr-2" size={24} />}
                    Analyze Impact
                  </button>

                  {monitorResult && (
                    <div className="mt-8 animate-fade-in">
                      <div className="p-6 bg-teal-50/80 rounded-2xl border border-teal-100 text-slate-800 leading-relaxed whitespace-pre-wrap shadow-inner">
                        {monitorResult}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-fade-in space-y-8">
                  <div className="flex gap-3 max-w-2xl mx-auto">
                    <div className="relative flex-1 group">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={20} />
                      <input 
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Enter city name..."
                        className="w-full pl-12 pr-4 py-4 bg-white/80 border-2 border-transparent focus:border-teal-500 rounded-2xl shadow-sm focus:shadow-lg outline-none transition-all text-lg"
                        onKeyDown={(e) => e.key === 'Enter' && checkCityAirQuality()}
                      />
                    </div>
                    <button
                      onClick={handleUseLocation}
                      disabled={monitorLoading}
                      title="Use My Location"
                      className="bg-white/80 hover:bg-white text-teal-600 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-teal-200"
                    >
                      <Navigation size={24} />
                    </button>
                    <button 
                      onClick={checkCityAirQuality}
                      disabled={monitorLoading || !city}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                      {monitorLoading ? <Loader2 className="animate-spin" /> : <Search size={24} />}
                    </button>
                  </div>

                  {cityResult && (
                    <div className="mt-8 animate-fade-in-up">
                      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-teal-400 rounded-3xl shadow-2xl text-white p-8 border border-white/20">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-teal-900/10 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10">
                          <h4 className="font-bold text-blue-50 text-sm uppercase tracking-widest mb-4 flex items-center opacity-80">
                             <Wind className="mr-2" size={16} /> Live Report
                          </h4>
                          <div className="prose prose-invert prose-lg max-w-none">
                             <div className="whitespace-pre-wrap font-medium">{cityResult}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!cityResult && !monitorLoading && (
                    <div className="text-center py-16 text-slate-400">
                      <div className="inline-block p-6 rounded-full bg-slate-100/50 mb-4">
                         <Wind size={48} className="text-slate-300" />
                      </div>
                      <p className="text-lg font-medium text-slate-500">Search for a city or use your location<br/>to see real-time air quality metrics.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Inline AI Assistant */}
              {(monitorResult || cityResult) && (
                 <div className="mt-8 pt-8 border-t border-slate-200/60">
                    <div className="flex items-center gap-3 mb-4 text-emerald-800 font-bold text-lg">
                      <div className="bg-emerald-100 p-2 rounded-full">
                        <MessageCircle size={20} className="text-emerald-600" />
                      </div>
                      <h3>EcoBot Contextual Help</h3>
                    </div>
                    
                    <div className="bg-white/50 p-2 rounded-2xl border border-white/60 shadow-inner flex gap-2">
                      <input 
                        type="text" 
                        value={inlineQuestion}
                        onChange={(e) => setInlineQuestion(e.target.value)}
                        placeholder="Ask follow-up questions about this data..."
                        className="flex-1 bg-transparent border-none px-4 py-2 focus:ring-0 outline-none text-slate-700 placeholder-slate-400"
                        onKeyDown={(e) => e.key === 'Enter' && askInlineAI()}
                      />
                      <button 
                        onClick={askInlineAI}
                        disabled={inlineLoading || !inlineQuestion}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-md"
                      >
                        {inlineLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                      </button>
                    </div>

                    {inlineAnswer && (
                      <div className="mt-4 p-5 bg-emerald-50/90 rounded-2xl text-emerald-900 border border-emerald-100 shadow-sm animate-fade-in flex items-start gap-3">
                        <div className="mt-1 bg-emerald-200 p-1 rounded-full shrink-0">
                           <Recycle size={14} className="text-emerald-700" />
                        </div>
                        <div className="text-sm leading-relaxed font-medium">
                           {inlineAnswer}
                        </div>
                      </div>
                    )}
                 </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="glass-panel p-8 rounded-3xl shadow-xl border border-white/60 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Trash2 className="mr-2 text-emerald-600" />
                    Waste Classifier
                  </h3>
                  <div 
                    className="flex-1 min-h-[350px] bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/60 transition-all relative overflow-hidden group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {wasteImage ? (
                      <img src={wasteImage} alt="Waste" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                           <Trash2 size={40} className="text-emerald-400" />
                        </div>
                        <p className="font-medium text-slate-500">Click to upload trash image</p>
                        <p className="text-xs mt-2 text-slate-400">AI will detect material type</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleWasteUpload} className="hidden" accept="image/*" />
                  </div>
                  <button 
                    onClick={analyzeWaste}
                    disabled={!wasteImage || wasteLoading}
                    className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                  >
                    {wasteLoading ? <Loader2 className="animate-spin mr-2" /> : "Identify & Sort"}
                  </button>
               </div>

               <div className="space-y-4 h-full">
                 {wasteResult ? (
                   <div className="glass-panel p-8 rounded-3xl shadow-xl border-t-4 border-emerald-500 animate-fade-in h-full flex flex-col">
                      <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detected Item</h4>
                        <h3 className="text-3xl font-extrabold text-slate-800">{wasteResult.title}</h3>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-8 bg-white/50 p-4 rounded-2xl border border-white/50">
                        <div className={`p-4 rounded-2xl ${
                          wasteResult.category.includes('Recyclable') ? 'bg-blue-100 text-blue-600' :
                          wasteResult.category.includes('Hazardous') ? 'bg-red-100 text-red-600' :
                          wasteResult.category.includes('Compost') ? 'bg-amber-100 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          <Recycle size={32} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500">Classification</p>
                          <p className="text-xl font-bold text-slate-800">{wasteResult.category}</p>
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100/50 flex-1">
                        <h4 className="font-bold text-emerald-800 mb-4 flex items-center">
                          <Recycle className="mr-2" size={18} /> Disposal Instructions
                        </h4>
                        <ul className="space-y-3">
                          {wasteResult.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start text-sm text-slate-700 font-medium">
                              <span className="mr-3 mt-1.5 w-2 h-2 bg-emerald-500 rounded-full shrink-0 shadow-sm"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                   </div>
                 ) : (
                   <div className="glass-panel p-8 rounded-3xl h-full flex items-center justify-center text-center text-slate-400 border border-dashed border-white/50">
                     <div>
                       <CloudRain size={64} className="mx-auto mb-6 opacity-20" />
                       <h3 className="text-lg font-semibold text-slate-600 mb-2">Ready to Sort</h3>
                       <p className="max-w-xs mx-auto text-slate-500">Upload an image and our AI will tell you exactly which bin to use for maximum sustainability.</p>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollutionModule;