'use client';

import { useState } from 'react';
import { X, Upload, FileText, Image, Link } from 'lucide-react';
import { UploadData } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (data: UploadData) => void;
}

export default function UploadModal({ onClose, onUpload }: UploadModalProps) {
  const [uploadType, setUploadType] = useState<'screenshot' | 'article' | 'text'>('text');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsUploading(true);
    
    try {
      const uploadData: UploadData = {
        type: uploadType,
        content: content.trim(),
        source_url: sourceUrl || undefined
      };
      
      // Here you would typically send to your API for processing
      // For now, we'll just simulate the upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onUpload(uploadData);
      onClose();
    } catch (error) {
      console.error('Error uploading content:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, just read as text
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Upload Content</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Upload Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of content are you uploading?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'text', label: 'Text/Notes', icon: FileText, description: 'Plain text or notes' },
                { type: 'screenshot', label: 'Screenshot', icon: Image, description: 'Image or screenshot' },
                { type: 'article', label: 'Article', icon: Link, description: 'Web article or link' }
              ].map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => setUploadType(type as any)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    uploadType === type
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-6 w-6 text-gray-600 mb-2" />
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-500">{description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Source URL (for articles) */}
          {uploadType === 'article' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source URL (optional)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="https://example.com/article"
              />
            </div>
          )}

          {/* File Upload (for screenshots) */}
          {uploadType === 'screenshot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          )}

          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              rows={6}
              placeholder={
                uploadType === 'text' 
                  ? "Paste your text or notes here..."
                  : uploadType === 'screenshot'
                  ? "Describe what's in the image..."
                  : "Paste the article content or describe what you learned..."
              }
            />
          </div>

          {/* Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <p className="text-sm text-blue-800">
              Our AI will analyze your content and suggest relevant mechanisms or interventions 
              that might apply to your situation. You can then add these suggestions to your 
              workbook or save them to your archive for later reference.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
