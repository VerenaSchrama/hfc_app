'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { getWorkbook, generateWorkbook } from '../../lib/api';
import { WorkbookData, UploadData, Mechanism, Intervention } from '../../types';
import MechanismCard from '../../components/MechanismCard';
import WorkbookSection from '../../components/WorkbookSection';
import WorkbookChatInterface from '../../components/WorkbookChatInterface';
import UploadModal from '../../components/UploadModal';
import { Upload, Archive, MessageCircle, Plus } from 'lucide-react';

export default function WorkbookPage() {
  const { isLoggedIn, loading } = useAuth();
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showAddMechanism, setShowAddMechanism] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  useEffect(() => {
    if (isLoggedIn && !loading) {
      loadWorkbook();
    }
  }, [isLoggedIn, loading]);

  const loadWorkbook = async () => {
    try {
      setIsLoading(true);
      const response = await getWorkbook();
      
      if (response.success && response.workbook) {
        setWorkbookData(response.workbook);
      } else {
        // If no workbook exists, generate one from intake data
        const intakeData = localStorage.getItem('intakeData');
        if (intakeData) {
          const parsedIntake = JSON.parse(intakeData);
          const generateResponse = await generateWorkbook(parsedIntake);
          if (generateResponse.success) {
            setWorkbookData(generateResponse.workbook);
          }
        }
      }
    } catch (error) {
      console.error('Error loading workbook:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkbookUpdate = (updatedData: Partial<WorkbookData>) => {
    setWorkbookData(prev => prev ? { ...prev, ...updatedData } : null);
  };

  const handleMechanismUpdate = (updatedMechanism: Mechanism) => {
    if (workbookData) {
      const updatedMechanisms = workbookData.mechanisms.map(m => 
        m.id === updatedMechanism.id ? updatedMechanism : m
      );
      setWorkbookData({ ...workbookData, mechanisms: updatedMechanisms });
    }
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

  if (loading || isLoading) {
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
          <h1 className="text-2xl font-bold text-foreground mb-4">Please log in to access your workbook</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-subtle px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Workbook</h1>
            <p className="text-secondary text-lg">Your personalized hormonal health journey</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              {showChat ? 'Hide Chat' : 'Ask Chat'}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-light text-white rounded-lg hover:bg-primary transition-colors font-medium"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg hover:bg-muted transition-colors font-medium"
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
          <div className="p-8">
            {/* Workbook Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Your Personalized Workbook</h1>
              <p className="text-secondary text-lg">Track your hormonal mechanisms and personalized interventions</p>
            </div>

            {/* Mechanisms with Interventions */}
            <div className="space-y-6">
              {workbookData?.mechanisms?.map((mechanism) => (
                <MechanismCard
                  key={mechanism.id}
                  mechanism={mechanism}
                  interventions={workbookData?.interventions || []}
                  onUpdate={handleMechanismUpdate}
                  onInterventionUpdate={handleInterventionUpdate}
                />
              ))}

              {/* Add New Mechanism Button */}
              <div className="text-center">
                <button 
                  onClick={() => setShowAddMechanism(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add New Mechanism
                </button>
              </div>
            </div>

            {/* Daily Reflections Section */}
            <div className="mt-12">
              <WorkbookSection
                title="Daily Reflections"
                subtitle="Track your symptoms, mood, energy, and food log"
                type="reflections"
                data={workbookData?.reflections || []}
                onUpdate={handleWorkbookUpdate}
                placeholder="Add today's reflection..."
              />
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
