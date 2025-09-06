'use client';

import { useState } from 'react';
import { Plus, Edit3, Save, X, Trash2, Clock, Lightbulb } from 'lucide-react';
import { Mechanism, Intervention } from '../types';
import { createIntervention, updateIntervention } from '../lib/api';

interface MechanismCardProps {
  mechanism: Mechanism;
  interventions: Intervention[];
  onUpdate: (updatedMechanism: Mechanism) => void;
  onInterventionUpdate: (intervention: Intervention) => void;
}

export default function MechanismCard({ 
  mechanism, 
  interventions, 
  onUpdate, 
  onInterventionUpdate 
}: MechanismCardProps) {
  const [isAddingIntervention, setIsAddingIntervention] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState<string | null>(null);
  const [newIntervention, setNewIntervention] = useState({
    title: '',
    description: '',
    user_notes: ''
  });

  const mechanismInterventions = interventions.filter(
    intervention => intervention.mechanism_id === mechanism.id
  );

  const handleAddIntervention = () => {
    setIsAddingIntervention(true);
    setNewIntervention({ title: '', description: '', user_notes: '' });
  };

  const handleSaveIntervention = async () => {
    try {
      const response = await createIntervention({
        title: newIntervention.title,
        description: newIntervention.description,
        user_notes: newIntervention.user_notes,
        mechanism_id: mechanism.id,
        is_tracking: false,
        source: 'user'
      });
      
      if (response.success) {
        onInterventionUpdate(response.intervention);
        setIsAddingIntervention(false);
        setNewIntervention({ title: '', description: '', user_notes: '' });
      }
    } catch (error) {
      console.error('Error saving intervention:', error);
    }
  };

  const handleUpdateIntervention = async (interventionId: string) => {
    try {
      await updateIntervention(interventionId, {
        title: newIntervention.title,
        description: newIntervention.description,
        user_notes: newIntervention.user_notes
      });
      
      setEditingIntervention(null);
      setNewIntervention({ title: '', description: '', user_notes: '' });
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error updating intervention:', error);
    }
  };

  const handleEditIntervention = (intervention: Intervention) => {
    setEditingIntervention(intervention.id);
    setNewIntervention({
      title: intervention.title,
      description: intervention.description,
      user_notes: intervention.user_notes || ''
    });
  };

  const handleCancel = () => {
    setIsAddingIntervention(false);
    setEditingIntervention(null);
    setNewIntervention({ title: '', description: '', user_notes: '' });
  };

  return (
    <div className="bg-card border border-subtle rounded-xl p-6 mb-6 shadow-sm">
      {/* Mechanism Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <h3 className="text-xl font-semibold text-foreground">{mechanism.title}</h3>
          <span className="bg-primary-light bg-opacity-20 text-primary px-3 py-1 rounded-full text-sm font-medium">
            active
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate(mechanism)}
            className="p-2 text-muted hover:text-primary transition-colors"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mechanism Description */}
      <p className="text-secondary mb-6 leading-relaxed">{mechanism.description}</p>

      {/* Interventions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h4 className="text-lg font-semibold text-foreground">Current Interventions</h4>
          </div>
          <button
            onClick={handleAddIntervention}
            className="flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {/* Interventions List */}
        <div className="space-y-3">
          {mechanismInterventions.map((intervention) => (
            <div key={intervention.id} className="bg-primary-light bg-opacity-5 border border-primary-light border-opacity-20 rounded-lg p-4">
              {editingIntervention === intervention.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newIntervention.title}
                    onChange={(e) => setNewIntervention({ ...newIntervention, title: e.target.value })}
                    className="w-full px-3 py-2 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                    placeholder="Intervention title..."
                  />
                  <textarea
                    value={newIntervention.description}
                    onChange={(e) => setNewIntervention({ ...newIntervention, description: e.target.value })}
                    className="w-full px-3 py-2 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                    placeholder="Description..."
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateIntervention(intervention.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm"
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1 px-3 py-1 bg-secondary text-white rounded-lg hover:bg-muted text-sm"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-foreground font-medium">{intervention.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted" />
                    <button
                      onClick={() => handleEditIntervention(intervention)}
                      className="p-1 text-muted hover:text-primary transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button className="p-1 text-muted hover:text-red-500 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add New Intervention Form */}
          {isAddingIntervention && (
            <div className="bg-primary-light bg-opacity-5 border border-primary-light border-opacity-20 rounded-lg p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newIntervention.title}
                  onChange={(e) => setNewIntervention({ ...newIntervention, title: e.target.value })}
                  className="w-full px-3 py-2 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                  placeholder="Intervention title..."
                />
                <textarea
                  value={newIntervention.description}
                  onChange={(e) => setNewIntervention({ ...newIntervention, description: e.target.value })}
                  className="w-full px-3 py-2 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
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
                    className="flex items-center gap-1 px-3 py-1 bg-secondary text-white rounded-lg hover:bg-muted text-sm"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {mechanismInterventions.length === 0 && !isAddingIntervention && (
            <div className="text-center py-4 text-muted text-sm">
              No interventions yet. Click "Add" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
