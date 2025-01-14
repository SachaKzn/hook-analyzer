import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnalysisResult {
  stakeScore: number;
  feedback: string;
  suggestions: string[];
  variations: string[];
}

const SpeedometerGauge = ({ score }: { score: number }) => {
  const rotation = (score / 100) * 180 - 90; // Convert score to degrees (-90 to 90)
  
  return (
    <div className="relative w-48 h-24 mx-auto mb-4">
      {/* Gauge background */}
      <div className="absolute w-full h-full bg-gray-200 rounded-t-full" />
      
      {/* Colored sections */}
      <div className="absolute w-full h-full">
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-t-full opacity-20" />
      </div>
      
      {/* Needle */}
      <div 
        className="absolute bottom-0 left-1/2 w-1 h-20 bg-black origin-bottom"
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      />
      
      {/* Score display */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-2 text-xl font-bold">
        {score}
      </div>
    </div>
  );
};

export const HookAnalyzer = () => {
  const [hookText, setHookText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeHook = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/analyze-hook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hook: hookText }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze hook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>The Wellness Assembly Hook Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your ad hook here..."
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              className="h-32"
            />
            
            <Button 
              onClick={analyzeHook}
              disabled={loading || !hookText.trim()}
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Analyze Hook'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {analysis && (
              <div className="mt-6 space-y-4">
                <SpeedometerGauge score={Math.round(analysis.stakeScore * 10)} />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Analysis Results</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">Stake Score: {analysis.stakeScore}/10</p>
                    <p className="text-gray-600 mt-2">{analysis.feedback}</p>
                  </div>
                  
                  <h4 className="font-medium mt-4">Suggested Improvements:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-gray-600">{suggestion}</li>
                    ))}
                  </ul>
                  
                  <h4 className="font-medium mt-4">Hook Variations:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    {analysis.variations.map((variation, index) => (
                      <li key={index} className="text-gray-600">{variation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HookAnalyzer;