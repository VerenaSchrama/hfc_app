'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, auth } from '../../lib/auth';
import { getWorkbook, generateWorkbook } from '../../lib/api';
import { WorkbookData, UploadData, Intervention } from '../../types';
import MechanismCard from '../../components/MechanismCard';
import WorkbookChatInterface from '../../components/WorkbookChatInterface';
import UploadModal from '../../components/UploadModal';
import { Upload, Archive, MessageCircle, Sparkles, Heart, Target, TrendingUp, BookOpen, Zap } from 'lucide-react';

export default function WorkbookPage() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [mounted, setMounted] = useState(false);

  const loadWorkbook = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading workbook...');
      console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL);
      
      // Check if user is authenticated
      const token = auth.getToken();
      console.log('Auth token exists:', !!token);
      console.log('Auth token value:', token);
      
      // Test API connectivity first
      try {
        const testResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/docs`);
        console.log('Backend connectivity test:', testResponse.status);
      } catch (testError) {
        console.error('Backend connectivity test failed:', testError);
      }
      
      try {
        const response = await getWorkbook();
        console.log('Get workbook response:', response);
        
        // Check if workbook has any data (mechanisms or interventions)
        const hasWorkbookData = response.success && response.workbook && 
          (response.workbook.mechanisms.length > 0 || response.workbook.interventions.length > 0);
        
        if (hasWorkbookData) {
          console.log('Workbook found with data:', response.workbook);
          setWorkbookData(response.workbook);
        } else {
          console.log('No workbook data found, checking for intake data...');
          // If no workbook exists, generate one from intake data
          const intakeData = localStorage.getItem('intakeData');
          console.log('Intake data exists:', !!intakeData);
          
          if (intakeData) {
            const parsedIntake = JSON.parse(intakeData);
            console.log('Parsed intake data:', parsedIntake);
            
            console.log('Generating workbook from intake data...');
            const generateResponse = await generateWorkbook(parsedIntake);
            console.log('Generate workbook response:', generateResponse);
            
            if (generateResponse.success) {
              console.log('Workbook generated successfully:', generateResponse.workbook);
              setWorkbookData(generateResponse.workbook);
            } else {
              console.error('Failed to generate workbook:', generateResponse);
            }
          } else {
            console.log('No intake data found in localStorage, redirecting to intake...');
            router.push('/intake');
          }
        }
      } catch (workbookError) {
        console.error('Error fetching workbook:', workbookError);
        // Try to generate workbook from intake data as fallback
        const intakeData = localStorage.getItem('intakeData');
        if (intakeData) {
          console.log('Attempting to generate workbook from intake data as fallback...');
          try {
            const parsedIntake = JSON.parse(intakeData);
            const generateResponse = await generateWorkbook(parsedIntake);
            if (generateResponse.success) {
              console.log('Workbook generated successfully as fallback:', generateResponse.workbook);
              setWorkbookData(generateResponse.workbook);
            } else {
              console.error('Failed to generate workbook as fallback:', generateResponse);
            }
          } catch (generateError) {
            console.error('Failed to generate workbook as fallback:', generateError);
          }
        } else {
          console.log('No intake data found, redirecting to intake...');
          router.push('/intake');
        }
      }
    } catch (error) {
      console.error('Error loading workbook:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn && !loading) {
      loadWorkbook();
    }
  }, [isLoggedIn, loading, loadWorkbook]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-500"></div>
      </div>
    );
  }



  const handleInterventionUpdate = (newIntervention: Intervention) => {
    if (workbookData) {
      const updatedInterventions = [...workbookData.interventions, newIntervention];
      setWorkbookData({ ...workbookData, interventions: updatedInterventions });
    }
  };

  const handleUpload = (uploadData: UploadData) => {
    // TODO: Process upload data and update workbook
    console.log('Upload data:', uploadData);
    // For now, just close the modal
    setShowUploadModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-pink-200 border-t-pink-500 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your personalized workbook...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Workbook</h2>
          <p className="text-gray-600 text-lg mb-8">Please log in to access your personalized hormonal health journey</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-pink-200 border-t-pink-500 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your workbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Workbook</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              {showChat ? 'Hide Chat' : 'Ask AI'}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-500 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </div>
        </div>

        <div className="flex h-screen">
        {/* Main Workbook Content */}
        <div className={`flex-1 ${showChat ? 'w-2/3' : 'w-full'} overflow-y-auto`}>
          <div className="max-w-4xl mx-auto">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{workbookData?.mechanisms?.length || 0}</p>
                    <p className="text-gray-600">Mechanisms</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{workbookData?.interventions?.length || 0}</p>
                    <p className="text-gray-600">Interventions</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {workbookData?.interventions?.filter(i => i.status === 'active').length || 0}
                    </p>
                    <p className="text-gray-600">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mechanisms Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Your Mechanisms</h2>
                  <p className="text-gray-600">Personalized strategies for your hormonal health</p>
                </div>
              </div>

              {/* Mechanisms List */}
              <div className="space-y-6">
                {workbookData?.mechanisms?.map((mechanism, index) => (
                  <div 
                    key={mechanism.id} 
                    className="transform hover:scale-[1.02] transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <MechanismCard
                      mechanism={mechanism}
                      interventions={workbookData?.interventions || []}
                      onInterventionUpdate={handleInterventionUpdate}
                    />
                  </div>
                ))}

                {/* Empty State */}
                {(!workbookData?.mechanisms || workbookData.mechanisms.length === 0) && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-pink-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No mechanisms yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Complete your intake form to generate personalized mechanisms and interventions for your hormonal health journey.
                    </p>
                    <button 
                      onClick={() => router.push('/intake')}
                      className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors font-semibold"
                    >
                      Complete Intake
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        {showChat && (
          <div className="w-1/3 border-l border-gray-200 bg-white flex flex-col shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                  <p className="text-gray-600 text-sm">Ask questions about your workbook</p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <WorkbookChatInterface workbookData={workbookData} />
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
        />
      )}

      {/* Archive View */}
      {showArchive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl h-96 overflow-y-auto shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Archive className="h-4 w-4 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Archive</h3>
              </div>
              <button
                onClick={() => setShowArchive(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Archive className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-gray-600 text-lg">Archive functionality coming soon...</p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
