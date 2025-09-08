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
import { Upload, Archive, MessageCircle, Plus } from 'lucide-react';

export default function WorkbookPage() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showAddMechanism, setShowAddMechanism] = useState(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Please log in</h2>
          <p className="text-text-muted mb-6">You need to be logged in to access your workbook.</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted">Loading your workbook...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Please log in to access your workbook</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Workbook</h1>
            <p className="text-gray-600 text-lg">Your personalized hormonal health journey</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium shadow-sm"
            >
              <MessageCircle className="h-4 w-4" />
              {showChat ? 'Hide Chat' : 'Ask Chat'}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium shadow-sm"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium shadow-sm"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Main Workbook Content */}
        <div className={`flex-1 ${showChat ? 'w-2/3' : 'w-full'} overflow-y-auto`}>
          <div className="p-6">
            {/* Workbook Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white text-xl">⚙️</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Mechanisms</h1>
              </div>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium shadow-sm"
              >
                <Upload className="h-4 w-4" />
                Add Data
              </button>
            </div>

            {/* Mechanisms List */}
            <div className="space-y-4">
              {workbookData?.mechanisms?.map((mechanism) => (
                <MechanismCard
                  key={mechanism.id}
                  mechanism={mechanism}
                  interventions={workbookData?.interventions || []}
                  onInterventionUpdate={handleInterventionUpdate}
                />
              ))}

              {/* Add New Mechanism Button */}
              <div className="text-center mt-8">
                <button 
                  onClick={() => setShowAddMechanism(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium mx-auto border border-gray-300"
                >
                  <Plus className="h-4 w-4" />
                  Add New Mechanism
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        {showChat && (
          <div className="w-1/3 border-l border-subtle bg-card flex flex-col">
            <div className="p-6 border-b border-subtle">
              <h3 className="text-xl font-semibold text-foreground mb-2">Workbook Assistant</h3>
              <p className="text-secondary">Ask questions about your mechanisms and interventions</p>
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

      {/* Add Mechanism Modal */}
      {showAddMechanism && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-foreground">Add New Mechanism</h3>
              <button
                onClick={() => setShowAddMechanism(false)}
                className="text-secondary hover:text-foreground text-xl"
              >
                ✕
              </button>
            </div>
            <WorkbookSection
              title=""
              subtitle=""
              type="mechanisms"
              data={[]}
              onUpdate={(data) => {
                if (data.mechanisms) {
                  handleWorkbookUpdate(data);
                  setShowAddMechanism(false);
                }
              }}
              placeholder="Add a new mechanism..."
            />
          </div>
        </div>
      )}

      {/* Archive View */}
      {showArchive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-4xl h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-foreground">Archive</h3>
              <button
                onClick={() => setShowArchive(false)}
                className="text-secondary hover:text-foreground text-xl"
              >
                ✕
              </button>
            </div>
            <p className="text-secondary">Archive functionality coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
}
