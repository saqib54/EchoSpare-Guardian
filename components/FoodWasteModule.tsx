import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2, CheckCircle2, AlertTriangle, HeartHandshake } from 'lucide-react';
import { analyzeImageWithGemini } from '../services/geminiService';
import { AnalysisResult } from '../types';

const FoodWasteModule: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFood = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const prompt = `
        Analyze this food image. 
        Identify the food items. 
        Categorize as 'Perishable' or 'Non-Perishable'. 
        Determine the 'status' as 'Fresh', 'Edible but Old', or 'Spoiled'. 
        Estimate approximate quantity/weight in metricLabel1/metricValue1.
        Suggest if it is suitable for 'Donation', 'Compost', or 'Immediate Consumption' in recommendations.
      `;
      const data = await analyzeImageWithGemini(image, prompt);
      setResult(data);
    } catch (error) {
      alert("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800">Food Waste Guardian</h2>
        <p className="text-slate-600 mt-2">Scan your food to check freshness, get donation tips, and reduce waste.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div 
            className="border-2 border-dashed border-slate-300 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              <img src={image} alt="Uploaded food" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <div className="bg-emerald-100 p-4 rounded-full inline-block mb-3">
                  <Camera className="text-emerald-600" size={32} />
                </div>
                <p className="font-medium text-slate-700">Click to upload or capture</p>
                <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>

          <div className="mt-6">
            <button
              onClick={analyzeFood}
              disabled={!image || loading}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all
                ${!image || loading 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> 
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Upload size={20} />
                  <span>Analyze Food</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-emerald-100 animate-fade-in">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{result.title}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2
                    ${result.category.toLowerCase().includes('perishable') ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
                  `}>
                    {result.category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Confidence</p>
                  <p className="font-bold text-emerald-600">{Math.round(result.confidence * 100)}%</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg mb-6">
                <p className="text-slate-700 text-sm leading-relaxed">{result.description}</p>
                <div className="flex gap-4 mt-4 border-t border-slate-200 pt-4">
                  {result.metrics?.map((m, i) => (
                    <div key={i}>
                      <p className="text-xs text-slate-500 uppercase font-semibold">{m.label}</p>
                      <p className="font-medium text-slate-800">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                <HeartHandshake size={18} className="mr-2 text-rose-500" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-emerald-500 mr-2 mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <AlertTriangle className="text-amber-400" size={32} />
              </div>
              <h3 className="font-semibold text-slate-700">No Analysis Yet</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-xs">Upload an image to identify food items, get freshness status, and see donation suggestions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodWasteModule;
