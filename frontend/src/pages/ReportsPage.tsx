import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { violationService } from '../services/violationService';
import { DashboardKPIs } from '../types/analytics';
import { Violation } from '../types/violation';
import { PageTransition } from '../components/ui/PageTransition';
import { useTheme } from '../contexts/ThemeContext';
import { ExecutiveHero } from '../components/reports/ExecutiveHero';
import { ExecutiveKpiGrid } from '../components/reports/ExecutiveKpiGrid';
import { AiExecutiveInsights } from '../components/reports/AiExecutiveInsights';
import { ExecutiveAnalytics, FilterState } from '../components/reports/ExecutiveAnalytics';
import { IncidentTimeline } from '../components/reports/IncidentTimeline';
import { DepartmentIntelligence } from '../components/reports/DepartmentIntelligence';
import { ReportMetadataFooter } from '../components/reports/ReportMetadataFooter';

export const ReportsPage: React.FC = () => {
  const [groupBy, setGroupBy] = useState<'type' | 'location' | 'department'>('type');
  const [reportData, setReportData] = useState<any>(null);
  const [kpiData, setKpiData] = useState<DashboardKPIs | null>(null);
  const [violationsList, setViolationsList] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();

  // Smart Filter State for Charts & Sub-analyses
  const [filters, setFilters] = useState<FilterState>({
    department: 'All',
    location: 'All',
    type: 'All',
    status: 'All',
  });

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      analyticsService.getReportData(groupBy),
      analyticsService.getDashboardKPIs(),
      violationService.getViolations(),
    ])
      .then(([rep, kpis, vios]) => {
        setReportData(rep);
        setKpiData(kpis);
        setViolationsList(vios || []);
      })
      .catch((err) => console.error('Error fetching reports telemetry:', err))
      .finally(() => setIsLoading(false));
  }, [groupBy]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ department: 'All', location: 'All', type: 'All', status: 'All' });
  };

  // Filter real violations in memory for chart, timeline & departmental drilldown
  const filteredViolations = violationsList.filter((v) => {
    if (filters.department !== 'All' && v.department !== filters.department) return false;
    if (filters.location !== 'All' && v.location !== filters.location) return false;
    if (filters.type !== 'All' && v.type !== filters.type) return false;
    if (filters.status !== 'All' && v.status !== filters.status) return false;
    return true;
  });

  // OVERALL INSTITUTIONAL BASELINE METRICS (Always fixed for Executive Hero & Top KPI Grid)
  const overallTotalViolations = kpiData?.total_violations ?? violationsList.length;
  const overallTotalStudents = kpiData?.total_students ?? 0;
  const todayActivity = kpiData?.today_activity ?? 0;
  const topViolationName = kpiData?.type_breakdown?.labels?.[0] || 'Late Arrival';
  const topViolationCount = kpiData?.type_breakdown?.data?.[0] || 0;
  const deptCount = kpiData?.dept_breakdown?.labels?.length || 5;
  const topLocationName = kpiData?.most_active_location?.name || 'Central Gate';
  const topLocationCount = kpiData?.most_active_location?.count || 0;
  const recognitionAccuracy = kpiData?.recognition_accuracy ?? 98.7;

  const overallResolvedCount = violationsList.filter((v) => v.status === 'Resolved').length;
  const overallResolvedRate = violationsList.length > 0 ? Math.round((overallResolvedCount / violationsList.length) * 100) : 100;
  const overallHealthScore = Math.max(70, Math.min(100, Math.round(100 - (overallTotalViolations * 0.3) + (overallResolvedRate * 0.15))));
  const overallRiskLevel = overallHealthScore >= 85 ? 'Low Risk' : overallHealthScore >= 70 ? 'Moderate Risk' : 'High Risk';

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* SECTION 1: EXECUTIVE HERO (Fixed overall institutional telemetry, does NOT change on sub-chart filters) */}
      <ExecutiveHero
        totalViolations={overallTotalViolations}
        totalStudents={overallTotalStudents}
        healthScore={overallHealthScore}
        riskLevel={overallRiskLevel}
        resolvedRate={overallResolvedRate}
        isLoading={isLoading}
      />

      {/* SECTION 2: INSTITUTIONAL KPI CARDS (Fixed overall institutional metrics) */}
      <ExecutiveKpiGrid
        totalViolations={overallTotalViolations}
        totalStudents={overallTotalStudents}
        todayActivity={todayActivity}
        topViolationName={topViolationName}
        topViolationCount={topViolationCount}
        deptCount={deptCount}
        topLocationName={topLocationName}
        topLocationCount={topLocationCount}
        recognitionAccuracy={recognitionAccuracy}
        healthScore={overallHealthScore}
        isLoading={isLoading}
      />

      {/* SECTION 3: AI EXECUTIVE INSIGHTS CHATBOT */}
      <AiExecutiveInsights
        violations={violationsList}
        totalStudents={overallTotalStudents}
        deptCount={deptCount}
      />

      {/* SECTION 4: INTERACTIVE ANALYTICS & INLINE LIVE SMART FILTERS */}
      <ExecutiveAnalytics
        groupBy={groupBy}
        onGroupByChange={(mode) => setGroupBy(mode)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        violations={filteredViolations}
        allViolations={violationsList}
        monthlyChart={kpiData?.monthly_chart}
        isLoading={isLoading}
        isDark={isDark}
      />

      {/* SECTION 5: INCIDENT TIMELINE */}
      <IncidentTimeline
        violations={filteredViolations}
        isLoading={isLoading}
      />

      {/* SECTION 6: DEPARTMENT INTELLIGENCE */}
      <DepartmentIntelligence
        violations={filteredViolations}
      />

      {/* SECTION 7: EXPORT & REPORT METADATA */}
      <ReportMetadataFooter
        totalViolations={overallTotalViolations}
        totalStudents={overallTotalStudents}
        violations={filteredViolations}
      />
    </PageTransition>
  );
};
