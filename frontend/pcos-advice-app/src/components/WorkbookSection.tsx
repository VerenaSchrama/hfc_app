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
            mechanisms: [...data, response.mechanism]
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
            interventions: [...data, response.intervention]
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
            reflections: [...data, response.reflection]
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
      <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Title..."
            />
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Description..."
              rows={3}
            />
            <textarea
              value={newItem.user_notes}
              onChange={(e) => setNewItem({ ...newItem, user_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Your notes..."
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate(item.id)}
                className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                <Save className="h-3 w-3" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">
                {'title' in item ? item.title : 'Daily Reflection'}
              </h4>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {'description' in item && (
              <p className="text-gray-700 mb-2">{item.description}</p>
            )}
            
            {item.user_notes && (
              <div className="bg-pink-50 border-l-4 border-pink-200 p-3 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Your notes:</strong> {item.user_notes}
                </p>
              </div>
            )}
            
            {'confidence_score' in item && item.confidence_score && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add {type === 'mechanisms' ? 'Mechanism' : type === 'interventions' ? 'Intervention' : 'Reflection'}
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {data.map(renderItem)}
        
        {isAdding && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              <input
                type="text"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder={placeholder}
              />
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Description..."
                rows={3}
              />
              <textarea
                value={newItem.user_notes}
                onChange={(e) => setNewItem({ ...newItem, user_notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Your notes..."
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  <Save className="h-3 w-3" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {data.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            <p>No {type} yet. Click "Add" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
