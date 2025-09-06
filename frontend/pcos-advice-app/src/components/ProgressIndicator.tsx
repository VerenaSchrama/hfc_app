'use client';

import { WorkbookData, ProgressMetrics } from '../types';
import { TrendingUp, Target, Calendar, CheckCircle } from 'lucide-react';

interface ProgressIndicatorProps {
  workbookData: WorkbookData | null;
}

export default function ProgressIndicator({ workbookData }: ProgressIndicatorProps) {
  if (!workbookData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const calculateMetrics = (): ProgressMetrics => {
    const mechanisms = workbookData.mechanisms || [];
    const interventions = workbookData.interventions || [];
    const reflections = workbookData.reflections || [];
    
    // Calculate reflections this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const reflectionsThisWeek = reflections.filter(reflection => 
      new Date(reflection.date) >= oneWeekAgo
    ).length;
    
    // Calculate completion rate (simplified)
    const totalPossible = mechanisms.length + interventions.length + reflectionsThisWeek;
    const completed = interventions.filter(i => i.is_tracking).length + reflectionsThisWeek;
    const completionRate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
    
    return {
      mechanisms_tracked: mechanisms.length,
      interventions_active: interventions.filter(i => i.is_tracking).length,
      reflections_this_week: reflectionsThisWeek,
      completion_rate: completionRate
    };
  };

  const metrics = calculateMetrics();

  const progressCards = [
    {
      title: 'Mechanisms',
      value: metrics.mechanisms_tracked,
      icon: TrendingUp,
      color: 'bg-blue-500',
      description: 'Key mechanisms identified'
    },
    {
      title: 'Active Interventions',
      value: metrics.interventions_active,
      icon: Target,
      color: 'bg-green-500',
      description: 'Currently tracking'
    },
    {
      title: 'This Week',
      value: metrics.reflections_this_week,
      icon: Calendar,
      color: 'bg-purple-500',
      description: 'Daily reflections'
    },
    {
      title: 'Progress',
      value: `${metrics.completion_rate}%`,
      icon: CheckCircle,
      color: 'bg-pink-500',
      description: 'Overall completion'
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {progressCards.map((card, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{card.value}</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">{card.title}</h4>
            <p className="text-sm text-gray-600">{card.description}</p>
          </div>
        ))}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{metrics.completion_rate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${metrics.completion_rate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
