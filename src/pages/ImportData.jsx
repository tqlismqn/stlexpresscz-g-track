import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ImportData() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Read file as text
      const text = await file.text();
      
      // Call the import function with CSV data
      const response = await base44.functions.invoke('importDriversCSV', { csv: text });
      
      setMessage(`✓ Successfully imported ${response.data.drivers_created} drivers and ${response.data.documents_created} documents`);
      setFile(null);
    } catch (err) {
      setError(`Import failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Import Drivers</h1>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Click to select CSV file
              </span>
            </label>
            
            {file && (
              <p className="mt-2 text-gray-600">
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          {message && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="mt-8">
            <Button
              onClick={handleImport}
              disabled={!file || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Drivers'
              )}
            </Button>
          </div>

          <p className="mt-6 text-sm text-gray-600">
            Upload the CSV file containing 424 drivers. The system will create driver records and their associated documents automatically.
          </p>
        </div>
      </div>
    </div>
  );
}