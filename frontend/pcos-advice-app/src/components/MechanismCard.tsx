'use client';
import { useState } from 'react';
import { Mechanism, Intervention } from '../types';
import { Plus, Edit3, Save, X, Lightbulb, Clock, ChevronDown, ChevronRight, MessageCircle, Target } from 'lucide-react';
import { createIntervention } from '../lib/api';

interface MechanismCardProps {
  mechanism: Mechanism;
  interventions: Intervention[];
  onInterventionUpdate: (newIntervention: Intervention) => void;
}

export default function MechanismCard({ mechanism, interventions, onInterventionUpdate }: MechanismCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingIntervention, setIsAddingIntervention] = useState(false);
  const [newIntervention, setNewIntervention] = useState({ title: '', description: '', tracking_frequency: 'daily' as 'daily' | 'weekly' | 'as_needed' });

  const mechanismInterventions = interventions.filter(
    (i) => i.mechanism_id === mechanism.id
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'active';
      case 'monitoring': return 'monitoring';
      case 'inactive': return 'inactive';
      default: return 'active';
    }
  };


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


  const handleCancel = () => {
    setIsAddingIntervention(false);
    setNewIntervention({ title: '', description: '', tracking_frequency: 'daily' as 'daily' | 'weekly' | 'as_needed' });
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      {/* Mechanism Header - Always Visible */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{mechanism.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{mechanism.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor('active')}`}>
              {getStatusText('active')}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement ask about this functionality
              }}
              className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Ask About This</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-600" /> : <ChevronRight className="h-5 w-5 text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Interventions Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <h4 className="font-semibold text-gray-900">Interventions</h4>
            </div>
            
            <div className="space-y-2">
              {mechanismInterventions.map((intervention) => (
                <div key={intervention.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">{intervention.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <button
                      onClick={() => handleEditIntervention(intervention)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Intervention */}
              {isAddingIntervention ? (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newIntervention.title}
                      onChange={(e) => setNewIntervention({ ...newIntervention, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Intervention title..."
                    />
                    <textarea
                      value={newIntervention.description}
                      onChange={(e) => setNewIntervention({ ...newIntervention, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Description..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveIntervention}
                        className="flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleAddIntervention}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Intervention
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}