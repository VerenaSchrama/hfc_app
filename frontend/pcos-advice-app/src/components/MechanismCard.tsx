'use client';
import { useState } from 'react';
import { Mechanism, Intervention } from '../types';
import { Plus, Edit3, Save, X, Lightbulb, Clock, ChevronDown, ChevronRight, MessageCircle, Target, CheckCircle } from 'lucide-react';
import { createIntervention, completeIntervention } from '../lib/api';
import TrialPeriodModal from './TrialPeriodModal';

interface MechanismCardProps {
  mechanism: Mechanism;
  interventions: Intervention[];
  onInterventionUpdate: (newIntervention: Intervention) => void;
}

export default function MechanismCard({ mechanism, interventions, onInterventionUpdate }: MechanismCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingIntervention, setIsAddingIntervention] = useState(false);
  const [newIntervention, setNewIntervention] = useState({ title: '', description: '', tracking_frequency: 'daily' as 'daily' | 'weekly' | 'as_needed' });
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  const mechanismInterventions = interventions.filter(
    (i) => i.mechanism_id === mechanism.id
  );



  const handleAddIntervention = () => {
    setIsAddingIntervention(true);
    setNewIntervention({ title: '', description: '', tracking_frequency: 'daily' });
  };

  const handleSaveIntervention = async () => {
    try {
      const response = await createIntervention({
        ...newIntervention,
        mechanism_id: mechanism.id,
        is_tracking: false,
        source: 'user'
      });
      
      if (response.success) {
        onInterventionUpdate(response.intervention);
        setIsAddingIntervention(false);
        setNewIntervention({ title: '', description: '', tracking_frequency: 'daily' });
      }
    } catch (error) {
      console.error('Error creating intervention:', error);
    }
  };

  const handleEditIntervention = (intervention: Intervention) => {
    // TODO: Implement intervention editing functionality
    console.log('Edit intervention:', intervention);
  };

  const handleCompleteIntervention = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setTrialModalOpen(true);
  };

  const handleTrialPeriodConfirm = async (trialData: { start_date: string; end_date: string; notes?: string }) => {
    if (!selectedIntervention) return;

    try {
      const result = await completeIntervention(selectedIntervention.id, trialData);
      console.log('Intervention completed:', result);
      
      // Update the intervention in the parent component
      onInterventionUpdate(result.intervention);
      
      setTrialModalOpen(false);
      setSelectedIntervention(null);
    } catch (error) {
      console.error('Error completing intervention:', error);
      alert('Failed to complete intervention');
    }
  };


  const handleCancel = () => {
    setIsAddingIntervention(false);
    setNewIntervention({ title: '', description: '', tracking_frequency: 'daily' as 'daily' | 'weekly' | 'as_needed' });
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-pink-200/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Mechanism Header - Always Visible */}
      <div 
        className="p-8 cursor-pointer hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-purple-50/50 transition-all duration-300"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{mechanism.title}</h3>
              <p className="text-gray-600 text-base leading-relaxed">{mechanism.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-semibold border border-green-200">
              Active
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement ask about this functionality
              }}
              className="flex items-center gap-2 px-4 py-2 text-pink-600 hover:bg-pink-50 rounded-xl transition-all duration-300 font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Ask AI</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-300 group"
            >
              {isExpanded ? 
                <ChevronDown className="h-5 w-5 text-gray-600 group-hover:text-pink-600 transition-colors" /> : 
                <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-pink-600 transition-colors" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-8 pb-8 space-y-8 bg-gradient-to-br from-pink-50/30 to-purple-50/30">
          {/* Interventions Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Interventions</h4>
            </div>
            
            <div className="space-y-4">
              {mechanismInterventions.map((intervention) => (
                <div key={intervention.id} className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-pink-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${
                      intervention.status === 'completed' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                      intervention.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      'bg-gradient-to-r from-gray-400 to-gray-500'
                    } shadow-lg`}></div>
                    <div>
                      <span className="text-base font-semibold text-gray-900">{intervention.title}</span>
                      {intervention.description && (
                        <p className="text-sm text-gray-600 mt-1">{intervention.description}</p>
                      )}
                    </div>
                    {intervention.status === 'completed' && (
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">
                        Completed
                      </span>
                    )}
                    {intervention.status === 'active' && (
                      <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-semibold border border-green-200">
                        Active
                      </span>
                    )}
                    {intervention.status === 'suggested' && (
                      <span className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 rounded-full text-xs font-semibold border border-pink-200">
                        Suggested
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {intervention.status === 'suggested' && (
                      <button
                        onClick={() => handleCompleteIntervention(intervention)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        title="Complete with trial period"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Complete
                      </button>
                    )}
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">{(intervention.tracking_frequency as string) || 'daily'}</span>
                    </div>
                    <button
                      onClick={() => handleEditIntervention(intervention)}
                      className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all duration-300"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Intervention */}
              {isAddingIntervention ? (
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-pink-200/50 shadow-lg">
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={newIntervention.title}
                      onChange={(e) => setNewIntervention({ ...newIntervention, title: e.target.value })}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-base shadow-sm"
                      placeholder="Intervention title..."
                    />
                    <textarea
                      value={newIntervention.description}
                      onChange={(e) => setNewIntervention({ ...newIntervention, description: e.target.value })}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-base shadow-sm"
                      placeholder="Description..."
                      rows={3}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveIntervention}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleAddIntervention}
                  className="flex items-center gap-3 px-6 py-4 text-gray-600 hover:bg-white/80 hover:text-pink-600 rounded-2xl transition-all duration-300 font-semibold border-2 border-dashed border-pink-200 hover:border-pink-300 w-full justify-center"
                >
                  <Plus className="h-5 w-5" />
                  Add New Intervention
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Trial Period Modal */}
      <TrialPeriodModal
        isOpen={trialModalOpen}
        onClose={() => {
          setTrialModalOpen(false);
          setSelectedIntervention(null);
        }}
        onConfirm={handleTrialPeriodConfirm}
        interventionTitle={selectedIntervention?.title || ''}
      />
    </div>
  );
}