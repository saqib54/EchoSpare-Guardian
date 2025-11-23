import React, { useState, useRef } from 'react';
import { Sprout, Droplets, Camera, Loader2, Activity, ThermometerSun } from 'lucide-react';
import { analyzeImageWithGemini, getTextAdvice } from '../services/geminiService';
import { AnalysisResult } from '../types';

const AgricultureModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'health' | 'irrigation'>('health');
  
  // Plant Health State
  const [image, setImage] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Irrigation State
  const [soilMoisture, setSoilMoisture] = useState(40);
  const [cropType, setCropType] = useState('Tomato');
  const [irrigationLoading, setIrrigationLoading] = useState(false);
  const [irrigationAdvice, setIrrigationAdvice] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setHealthResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePlant = async () => {
    if (!image) return;
    setHealthLoading(true);
    try {
      const prompt = `
        Analyze this plant image. 
        Identify the plant species. 
        Detect any diseases or nutrient deficiencies.
        Set status to 'Healthy', 'Diseased', or 'Deficient'.
        Provide treatment suggestions.
      `;
      const data = await analyzeImageWithGemini(image, prompt);
      setHealthResult(data);
    } catch (error) {
      alert("Analysis failed.");
    } finally {
      setHealthLoading(false);
    }
  };

  const getIrrigationPlan = async () => {
    setIrrigationLoading(true);
    try {
      const prompt = `
        Act as an agriculture expert.
        The crop is ${cropType}. 
        Soil moisture sensor reading is ${soilMoisture}%.
        Suggest an optimal watering schedule for the next 3 days.
        Warn if the current moisture is too low or too high for this specific crop.
        Keep the response concise (max 100 words).
      `;
      const advice = await getTextAdvice(prompt);
      setIrrigationAdvice(advice);
    } catch (error) {
      setIrrigationAdvice("Could not generate plan.");
    } finally {
      setIrrigationLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Smart Agriculture</h2>
          <p className="text-slate-600">Monitor crop health and optimize water usage.</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'health' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Plant Health
          </button>
          <button
            onClick={() => setActiveTab('irrigation')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'irrigation' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Smart Irrigation
          </button>
        </div>
      </header>

      {activeTab === 'health' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div 
               className="h-80 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative cursor-pointer hover:bg-slate-100 transition-colors"
               onClick={() => fileInputRef.current?.click()}
             >
               {image ? (
                 <img src={image} alt="Plant" className="w-full h-full object-cover" />
               ) : (
                 <div className="text-center text-slate-400">
                   <Sprout size={48} className="mx-auto mb-2 text-emerald-400" />
                   <p>Upload plant leaf image</p>
                 </div>
               )}
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
             </div>
             <button
                onClick={analyzePlant}
                disabled={!image || healthLoading}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium flex justify-center items-center disabled:opacity-50"
             >
                {healthLoading ? <Loader2 className="animate-spin" /> : "Diagnose Plant"}
             </button>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
             {healthResult ? (
               <div className="animate-fade-in">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-2xl font-bold text-slate-800">{healthResult.title}</h3>
                   <span className={`px-3 py-1 rounded-full text-sm font-bold
                     ${healthResult.status === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                   `}>
                     {healthResult.status}
                   </span>
                 </div>
                 <p className="text-slate-600 mb-6">{healthResult.description}</p>
                 
                 <div className="space-y-4">
                   <h4 className="font-semibold text-slate-800 flex items-center">
                     <Activity size={18} className="mr-2 text-emerald-600" />
                     Treatment Plan
                   </h4>
                   <ul className="space-y-3">
                     {healthResult.recommendations.map((rec, i) => (
                       <li key={i} className="flex items-start text-sm bg-slate-50 p-3 rounded-lg">
                         <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs mr-3 shrink-0">
                           {i + 1}
                         </span>
                         {rec}
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                 <Activity size={48} className="mb-4 opacity-20" />
                 <p>Diagnostics will appear here</p>
               </div>
             )}
           </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Crop Type</label>
                <select 
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>Tomato</option>
                  <option>Wheat</option>
                  <option>Corn</option>
                  <option>Rice</option>
                  <option>Potato</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex justify-between">
                  <span>Soil Moisture Level</span>
                  <span className="text-blue-600 font-bold">{soilMoisture}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={soilMoisture} 
                  onChange={(e) => setSoilMoisture(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Dry (0%)</span>
                  <span>Wet (100%)</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg flex items-start space-x-3">
                 <ThermometerSun className="text-blue-500 shrink-0" />
                 <div>
                   <h4 className="font-semibold text-blue-900 text-sm">Weather Context</h4>
                   <p className="text-xs text-blue-700 mt-1">Local forecast: 28°C, Sunny. Evaporation rate high.</p>
                 </div>
              </div>

              <button
                onClick={getIrrigationPlan}
                disabled={irrigationLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex justify-center items-center"
              >
                {irrigationLoading ? <Loader2 className="animate-spin mr-2" /> : <Droplets className="mr-2" size={20} />}
                Generate Schedule
              </button>
            </div>

            <div className="border-l border-slate-100 pl-0 md:pl-12 flex flex-col justify-center">
              {irrigationAdvice ? (
                <div className="animate-fade-in">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <Droplets className="mr-2 text-blue-500" /> 
                    Optimal Schedule
                  </h3>
                  <div className="prose prose-sm text-slate-600 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    {irrigationAdvice}
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                   <p>Adjust parameters and click Generate to see AI-optimized irrigation plan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgricultureModule;
