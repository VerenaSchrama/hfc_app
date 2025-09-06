'use client';

import { useState } from 'react';
import { Plus, Edit3, Save, X, Trash2 } from 'lucide-react';
import { Mechanism, Intervention, DailyReflection, WorkbookData } from '../types';
import { createMechanism, createIntervention, createReflection, updateMechanism, updateIntervention } from '../lib/api';

interface WorkbookSectionProps {
  title: string;
  subtitle: string;
  type: 'mechanisms' | 'interventions' | 'reflections';
  data: (Mechanism | Intervention | DailyReflection)[];
  onUpdate: (updatedData: Partial<WorkbookData>) => void;
  placeholder: string;
}

export default function WorkbookSection({ 
  title, 
  subtitle, 
  type, 
  data, 
  onUpdate, 
  placeholder 
}: WorkbookSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    user_notes: ''
  });

  const handleAdd = () => {
    setIsAdding(true);
    setNewItem({ title: '', description: '', user_notes: '' });
  };

  const handleSave = async () => {
    try {
      if (type === 'mechanisms') {
        const response = await createMechanism({
          title: newItem.title,
          description: newItem.description,
          user_notes: newItem.user_notes,
          source: 'user'
        });
        
        if (response.success) {
          onUpdate({
            mechanisms: [...(data as Mechanism[]), response.mechanism]
          });
        }
      } else if (type === 'interventions') {
        const response = await createIntervention({
          title: newItem.title,
          description: newItem.description,
          user_notes: newItem.user_notes,
          mechanism_id: '', // Will need to be selected from mechanisms
          is_tracking: false,
          source: 'user'
        });
        
        if (response.success) {
          onUpdate({
            interventions: [...(data as Intervention[]), response.intervention]
          });
        }
      } else if (type === 'reflections') {
        const response = await createReflection({
          date: new Date().toISOString().split('T')[0],
          energy_level: 5,
          mood: 5,
          symptoms: {},
          notes: newItem.description,
          interventions_applied: [],
          additional_notes: newItem.user_notes
        });
        
        if (response.success) {
          onUpdate({
            reflections: [...(data as DailyReflection[]), response.reflection]
          });
        }
      }
      
      setIsAdding(false);
      setNewItem({ title: '', description: '', user_notes: '' });
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewItem({ title: '', description: '', user_notes: '' });
  };

  const handleEdit = (item: Mechanism | Intervention | DailyReflection) => {
    setEditingId(item.id);
    setNewItem({
      title: 'title' in item ? item.title : '',
      description: 'description' in item ? item.description : '',
      user_notes: item.user_notes || ''
    });
  };

  const handleUpdate = async (itemId: string) => {
    try {
      if (type === 'mechanisms') {
        await updateMechanism(itemId, {
          title: newItem.title,
          description: newItem.description,
          user_notes: newItem.user_notes
        });
      } else if (type === 'interventions') {
        await updateIntervention(itemId, {
          title: newItem.title,
          description: newItem.description,
          user_notes: newItem.user_notes
        });
      }
      
      setEditingId(null);
      setNewItem({ title: '', description: '', user_notes: '' });
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const renderItem = (item: Mechanism | Intervention | DailyReflection) => {
    const isEditing = editingId === item.id;
    
    return (
      <div key={item.id} className="bg-card border border-subtle rounded-lg p-5 hover:shadow-sm transition-shadow">
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="w-full px-4 py-3 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Title..."
            />
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full px-4 py-3 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Description..."
              rows={3}
            />
            <textarea
              value={newItem.user_notes}
              onChange={(e) => setNewItem({ ...newItem, user_notes: e.target.value })}
              className="w-full px-4 py-3 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Your notes..."
              rows={2}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdate(item.id)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-muted font-medium"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-foreground text-lg">
                {'title' in item ? item.title : 'Daily Reflection'}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-muted hover:text-primary transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button className="p-2 text-muted hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {'description' in item && (
              <p className="text-secondary mb-3 leading-relaxed">{item.description}</p>
            )}
            
            {item.user_notes && (
              <div className="bg-primary-light bg-opacity-10 border-l-4 border-primary p-4 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong className="text-primary">Your notes:</strong> {item.user_notes}
                </p>
              </div>
            )}
            
            {'confidence_score' in item && item.confidence_score && (
              <div className="mt-3">
                <span className="text-xs text-muted font-medium">
                  Confidence: {item.confidence_score}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">{title}</h2>
          <p className="text-secondary text-base">{subtitle}</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Add {type === 'mechanisms' ? 'Mechanism' : type === 'interventions' ? 'Intervention' : 'Reflection'}
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {data.map(renderItem)}
        
        {isAdding && (
          <div className="bg-card border border-subtle rounded-lg p-5">
            <div className="space-y-4">
              <input
                type="text"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="w-full px-4 py-3 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder={placeholder}
              />
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-4 py-3 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="Description..."
                rows={3}
              />
              <textarea
                value={newItem.user_notes}
                onChange={(e) => setNewItem({ ...newItem, user_notes: e.target.value })}
                className="w-full px-4 py-3 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="Your notes..."
                rows={2}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-muted font-medium"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {data.length === 0 && !isAdding && (
          <div className="text-center py-12 text-muted">
            <p className="text-base">No {type} yet. Click &quot;Add&quot; to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
