'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, auth } from '../../lib/auth';
import { getWorkbook, generateWorkbook } from '../../lib/api';
import { WorkbookData, UploadData, Intervention } from '../../types';
import MechanismCard from '../../components/MechanismCard';
import WorkbookSection from '../../components/WorkbookSection';
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
  }, [isLoggedIn, router]);

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

  const handleWorkbookUpdate = (updatedData: Partial<WorkbookData>) => {
    setWorkbookData(prev => prev ? { ...prev, ...updatedData } : null);
  };


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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10"></div>
        <div className="relative bg-white/80 backdrop-blur-sm border-b border-pink-200/50 px-6 py-12 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    My Workbook
                  </h1>
                  <p className="text-gray-600 text-xl">Your personalized hormonal health journey</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  {showChat ? 'Hide Chat' : 'Ask AI'}
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Upload className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Upload
                </button>
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Archive className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Main Workbook Content */}
        <div className={`flex-1 ${showChat ? 'w-2/3' : 'w-full'} overflow-y-auto`}>
          <div className="max-w-7xl mx-auto p-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-200/50 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{workbookData?.mechanisms?.length || 0}</p>
                    <p className="text-gray-600 font-medium">Mechanisms</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-200/50 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{workbookData?.interventions?.length || 0}</p>
                    <p className="text-gray-600 font-medium">Interventions</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-indigo-200/50 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {workbookData?.interventions?.filter(i => i.status === 'active').length || 0}
                    </p>
                    <p className="text-gray-600 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mechanisms Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Your Mechanisms</h2>
                  <p className="text-gray-600 text-lg">Personalized strategies for your hormonal health</p>
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
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="h-12 w-12 text-pink-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No mechanisms yet</h3>
                    <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                      Complete your intake form to generate personalized mechanisms and interventions for your hormonal health journey.
                    </p>
                    <button 
                      onClick={() => router.push('/intake')}
                      className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
          <div className="w-1/3 border-l border-pink-200/50 bg-white/70 backdrop-blur-sm flex flex-col shadow-xl">
            <div className="p-6 border-b border-pink-200/50 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">AI Assistant</h3>
                  <p className="text-gray-600">Ask questions about your workbook</p>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 w-full max-w-4xl h-96 overflow-y-auto shadow-2xl border border-pink-200/50">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                  <Archive className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Archive</h3>
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
  );
}
