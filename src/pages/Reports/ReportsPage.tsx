import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout/Layout';
import html2pdf from 'html2pdf.js';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Fuel,
  MapPin,
  Clock,
  Coins,
  ChevronDown,
  Car,
  Users,
  AlertTriangle,
  Wrench,
  FileText,
  FileSpreadsheet,
  Loader2,
  X,
  Filter
} from 'lucide-react';
import { reportsApi, type ReportsSummary, type PeriodType, type ExportType } from '@/api/reports';
import { vehicleApi } from '@/api/vehicles';
import { driversApi } from '@/api/drivers';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';
import type { Vehicle, Driver } from '@/types';

const PERIODS: { value: PeriodType; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'last_month', label: 'Mois dernier' },
  { value: '3_months', label: '3 derniers mois' },
  { value: '6_months', label: '6 derniers mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Période personnalisée' },
];

const EXPORT_TYPES: { value: ExportType; label: string; icon: typeof FileText }[] = [
  { value: 'all', label: 'Tout', icon: FileText },
  { value: 'fuel', label: 'Carburant', icon: Fuel },
  { value: 'trips', label: 'Trajets', icon: MapPin },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'incidents', label: 'Incidents', icon: AlertTriangle },
];

export default function ReportsPage() {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [data, setData] = useState<ReportsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Period selection
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filters
  const [vehicleFilter, setVehicleFilter] = useState<number | null>(null);
  const [driverFilter, setDriverFilter] = useState<number | null>(null);
  const [showVehicleFilter, setShowVehicleFilter] = useState(false);
  const [showDriverFilter, setShowDriverFilter] = useState(false);

  // Export
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('all');

  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const vehicleDropdownRef = useRef<HTMLDivElement>(null);
  const driverDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await reportsApi.getSummary({
        period: selectedPeriod !== 'custom' ? selectedPeriod : undefined,
        start_date: selectedPeriod === 'custom' ? customStartDate : undefined,
        end_date: selectedPeriod === 'custom' ? customEndDate : undefined,
        vehicle: vehicleFilter || undefined,
        driver: driverFilter || undefined,
      });
      setData(response);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, customStartDate, customEndDate, vehicleFilter, driverFilter]);

  const fetchFiltersData = async () => {
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        vehicleApi.getAll(),
        driversApi.getAll(),
      ]);
      setVehicles(vehiclesRes.results || vehiclesRes);
      setDrivers(driversRes.results || driversRes);
    } catch (error) {
      console.error('Error fetching filters data:', error);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    if (selectedPeriod !== 'custom' || (customStartDate && customEndDate)) {
      fetchData();
    }
  }, [fetchData, selectedPeriod, customStartDate, customEndDate]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setShowPeriodMenu(false);
      }
      if (vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(event.target as Node)) {
        setShowVehicleFilter(false);
      }
      if (driverDropdownRef.current && !driverDropdownRef.current.contains(event.target as Node)) {
        setShowDriverFilter(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Export handlers
  const handleExportPDF = async () => {
    if (!reportRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const element = reportRef.current;
      const opt = {
        margin: 10,
        filename: `rapport-rewise-${data?.period.start}-${data?.period.end}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Erreur export PDF:', error);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const handleExportCSV = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const blob = await reportsApi.exportCSV({
        type: exportType,
        period: selectedPeriod !== 'custom' ? selectedPeriod : undefined,
        start_date: selectedPeriod === 'custom' ? customStartDate : undefined,
        end_date: selectedPeriod === 'custom' ? customEndDate : undefined,
        vehicle: vehicleFilter || undefined,
        driver: driverFilter || undefined,
      });
      reportsApi.downloadFile(blob, `rapport-${exportType}-${data?.period.start}-${data?.period.end}.csv`);
    } catch (error) {
      console.error('Erreur export CSV:', error);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const handleExportJSON = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const jsonData = await reportsApi.exportJSON({
        type: exportType,
        period: selectedPeriod !== 'custom' ? selectedPeriod : undefined,
        start_date: selectedPeriod === 'custom' ? customStartDate : undefined,
        end_date: selectedPeriod === 'custom' ? customEndDate : undefined,
        vehicle: vehicleFilter || undefined,
        driver: driverFilter || undefined,
      });
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      reportsApi.downloadFile(blob, `rapport-${exportType}-${data?.period.start}-${data?.period.end}.json`);
    } catch (error) {
      console.error('Erreur export JSON:', error);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Stats configuration
  const statsConfig = data ? [
    {
      title: 'Distance totale',
      value: `${data.stats.distance.value.toLocaleString()} km`,
      change: data.stats.distance.change,
      icon: MapPin,
      color: '#6A8A82'
    },
    {
      title: 'Carburant',
      value: `${data.stats.fuel.value.toFixed(0)} L`,
      change: data.stats.fuel.change,
      icon: Fuel,
      color: '#5A7A72'
    },
    {
      title: "Temps d'utilisation",
      value: `${data.stats.hours.value.toFixed(0)} h`,
      change: data.stats.hours.change,
      icon: Clock,
      color: '#B87333'
    },
    {
      title: 'Coûts totaux',
      value: `${data.stats.total_cost.value.toFixed(2)} ${currencySymbol}`,
      change: data.stats.total_cost.change,
      icon: Coins,
      color: '#A86323'
    },
  ] : [];

  const maxTrips = Math.max(...(data?.weekly_data?.map(d => d.trips) || [1]), 1);

  const selectedVehicle = vehicles.find(v => v.id === vehicleFilter);
  const selectedDriver = drivers.find(d => d.id === driverFilter);

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-semibold text-gray-800">
              Rapports & Analyses
            </h1>
            <p className="text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1">Statistiques et analyses de votre flotte</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Period Selector */}
            <div className="relative" ref={periodDropdownRef}>
              <button
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                className="soft-btn flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-2 sm:py-3"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                <span className="font-medium text-xs sm:text-sm max-w-[100px] sm:max-w-none truncate" style={{ color: '#6A8A82' }}>
                  {PERIODS.find(p => p.value === selectedPeriod)?.label}
                </span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#6A8A82' }} />
              </button>

              {showPeriodMenu && (
                <div className="soft-dropdown absolute top-full mt-2 right-0 py-2 z-20 min-w-[180px] sm:min-w-[220px]">
                  {PERIODS.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => {
                        setSelectedPeriod(period.value);
                        if (period.value !== 'custom') {
                          setShowPeriodMenu(false);
                        }
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-all text-sm font-medium ${
                        selectedPeriod === period.value ? 'font-semibold' : ''
                      }`}
                      style={{
                        color: selectedPeriod === period.value ? '#6A8A82' : '#1f2937',
                        backgroundColor: selectedPeriod === period.value ? '#E8EFED' : 'transparent'
                      }}
                    >
                      {period.label}
                    </button>
                  ))}

                  {/* Custom date inputs */}
                  {selectedPeriod === 'custom' && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Du</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="soft-input w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Au</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="soft-input w-full"
                          />
                        </div>
                        <button
                          onClick={() => setShowPeriodMenu(false)}
                          disabled={!customStartDate || !customEndDate}
                          className="w-full text-white disabled:opacity-50 btn-primary"
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vehicle Filter */}
            <div className="relative" ref={vehicleDropdownRef}>
              <button
                onClick={() => setShowVehicleFilter(!showVehicleFilter)}
                className={`soft-btn flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-2 sm:py-3 ${
                  vehicleFilter ? 'shadow-sm' : ''
                }`}
                style={{
                  borderColor: vehicleFilter ? '#6A8A82' : undefined,
                  backgroundColor: vehicleFilter ? '#E8EFED' : undefined,
                  color: vehicleFilter ? '#6A8A82' : '#6B7280'
                }}
              >
                <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-xs sm:text-sm max-w-[60px] sm:max-w-none truncate">
                  {selectedVehicle?.license_plate || 'Véhicule'}
                </span>
                {vehicleFilter ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVehicleFilter(null);
                    }}
                    className="p-0.5 rounded-full hover:bg-white/50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>

              {showVehicleFilter && (
                <div className="soft-dropdown absolute top-full mt-2 right-0 z-20 max-h-64 overflow-y-auto min-w-[200px]">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setVehicleFilter(null);
                        setShowVehicleFilter(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        !vehicleFilter ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                      }`}
                    >
                      Tous les véhicules
                    </button>
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => {
                          setVehicleFilter(vehicle.id);
                          setShowVehicleFilter(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          vehicleFilter === vehicle.id ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-medium">{vehicle.license_plate}</span>
                        <span className="text-gray-500 ml-2 text-xs">{vehicle.brand}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Driver Filter */}
            <div className="relative" ref={driverDropdownRef}>
              <button
                onClick={() => setShowDriverFilter(!showDriverFilter)}
                className={`soft-btn flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-2 sm:py-3 ${
                  driverFilter ? 'shadow-sm' : ''
                }`}
                style={{
                  borderColor: driverFilter ? '#B87333' : undefined,
                  backgroundColor: driverFilter ? '#F5E8DD' : undefined,
                  color: driverFilter ? '#B87333' : '#6B7280'
                }}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-xs sm:text-sm max-w-[70px] sm:max-w-none truncate">
                  {selectedDriver ? selectedDriver.full_name : 'Conducteur'}
                </span>
                {driverFilter ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDriverFilter(null);
                    }}
                    className="p-0.5 rounded-full hover:bg-white/50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>

              {showDriverFilter && (
                <div className="soft-dropdown absolute top-full mt-2 right-0 z-20 max-h-64 overflow-y-auto min-w-[200px]">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setDriverFilter(null);
                        setShowDriverFilter(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        !driverFilter ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                      }`}
                    >
                      Tous les conducteurs
                    </button>
                    {drivers.map((driver) => (
                      <button
                        key={driver.id}
                        onClick={() => {
                          setDriverFilter(driver.id);
                          setShowDriverFilter(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          driverFilter === driver.id ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                        }`}
                      >
                        {driver.full_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Export Button */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting || isLoading}
                className="flex items-center space-x-1.5 sm:space-x-2 text-white transition-all disabled:opacity-50 btn-primary"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="font-semibold text-xs sm:text-sm">Exporter</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>

              {showExportMenu && (
                <div className="soft-dropdown absolute top-full mt-2 right-0 z-20 w-64 sm:w-72">
                  {/* Export Type Selection */}
                  <div className="p-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Type de données</p>
                    <div className="flex flex-wrap gap-2">
                      {EXPORT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setExportType(type.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            exportType === type.value
                              ? 'shadow-sm'
                              : 'hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: exportType === type.value ? '#E8EFED' : 'transparent',
                            color: exportType === type.value ? '#6A8A82' : '#6B7280'
                          }}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Export Format Buttons */}
                  <div className="p-2">
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <FileText className="w-5 h-5 text-red-500" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Export PDF</p>
                        <p className="text-xs text-gray-500">Rapport visuel complet</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportCSV}
                      disabled={isExporting}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Export CSV</p>
                        <p className="text-xs text-gray-500">Compatible Excel</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportJSON}
                      disabled={isExporting}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Export JSON</p>
                        <p className="text-xs text-gray-500">Données brutes</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(vehicleFilter || driverFilter) && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-500">Filtres:</span>
            {vehicleFilter && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium" style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}>
                {selectedVehicle?.license_plate}
              </span>
            )}
            {driverFilter && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium" style={{ backgroundColor: '#F5E8DD', color: '#B87333' }}>
                {selectedDriver?.full_name}
              </span>
            )}
            <button
              onClick={() => {
                setVehicleFilter(null);
                setDriverFilter(null);
              }}
              className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Effacer
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" style={{ color: '#6A8A82' }} />
          </div>
        )}

        {/* Report Content */}
        {!isLoading && data && (
          <div ref={reportRef} className="space-y-4 sm:space-y-6">
            {/* Period Info */}
            <div className="text-xs sm:text-sm text-gray-500">
              Période: {new Date(data.period.start).toLocaleDateString('fr-FR')} - {new Date(data.period.end).toLocaleDateString('fr-FR')}
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {statsConfig.map((stat) => {
                const Icon = stat.icon;
                const isPositive = stat.change >= 0;
                const isGoodTrend = stat.title === 'Carburant' || stat.title === 'Coûts totaux'
                  ? stat.change <= 0
                  : stat.change >= 0;

                return (
                  <div key={stat.title} className="stat-card">
                    <div className="stat-accent" style={{ backgroundColor: stat.color }} />
                    <div className="flex items-start justify-between mb-2">
                      <div className="stat-icon" style={{ backgroundColor: `${stat.color}12` }}>
                        <Icon className="w-4 h-4" style={{ color: stat.color }} />
                      </div>
                      <div className={`flex items-center text-[10px] sm:text-xs font-medium ${isGoodTrend ? 'text-green-500' : 'text-red-400'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                        {isPositive ? '+' : ''}{stat.change.toFixed(1)}%
                      </div>
                    </div>
                    <p className="stat-label">{stat.title}</p>
                    <p className="stat-value" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Weekly Activity Chart */}
              <div className="lg:col-span-2 data-table-container p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-sm sm:text-lg font-semibold text-gray-800">Activité hebdomadaire</h2>
                    <p className="text-[10px] sm:text-sm text-gray-500">Trajets et distances parcourus</p>
                  </div>
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {data.weekly_data.map((day) => (
                    <div key={day.date} className="space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-semibold w-7 sm:w-10" style={{ color: '#6A8A82' }}>{day.day}</span>
                        <div className="flex-1 mx-2 sm:mx-4">
                          <div className="h-5 sm:h-7 bg-gray-100 rounded-md sm:rounded-lg overflow-hidden">
                            <div
                              className="h-full rounded-md sm:rounded-lg flex items-center justify-end pr-1.5 sm:pr-3 transition-all"
                              style={{
                                width: `${Math.max((day.trips / maxTrips) * 100, 5)}%`,
                                background: 'linear-gradient(to right, #6A8A82, #B87333)'
                              }}
                            >
                              <span className="text-[9px] sm:text-xs font-semibold text-white">{day.trips}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-gray-500 text-[10px] sm:text-xs w-14 sm:w-20 text-right">{day.distance.toFixed(0)} km</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t flex items-center justify-between text-[10px] sm:text-sm" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded"
                      style={{ background: 'linear-gradient(to right, #6A8A82, #B87333)' }}
                    />
                    <span className="text-gray-500">Nombre de trajets</span>
                  </div>
                  <span className="font-semibold" style={{ color: '#6A8A82' }}>
                    Total: {data.stats.trips.value} trajets
                  </span>
                </div>
              </div>

              {/* Top Vehicles */}
              <div className="data-table-container p-4 sm:p-6">
                <h2 className="text-sm sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Top véhicules</h2>
                <div className="space-y-2 sm:space-y-3">
                  {data.top_vehicles.length > 0 ? (
                    data.top_vehicles.map((vehicle, index) => (
                      <div
                        key={vehicle.vehicle_id}
                        className="data-card p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <div
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold text-white"
                              style={{
                                backgroundColor: index === 0 ? '#B87333' : index === 1 ? '#6A8A82' : '#9CA3AF'
                              }}
                            >
                              {index + 1}
                            </div>
                            <span className="font-semibold text-xs sm:text-sm" style={{ color: '#6A8A82' }}>{vehicle.plate}</span>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{vehicle.trips} trajets</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                          <div>
                            <p className="text-gray-400">Distance</p>
                            <p className="font-semibold text-gray-700">{vehicle.distance.toFixed(0)} km</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Efficacité</p>
                            <p className="font-semibold" style={{ color: '#6A8A82' }}>
                              {vehicle.efficiency.toFixed(1)} L/100km
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-500 text-center py-3 sm:py-4">Aucune donnée</p>
                  )}
                </div>
              </div>
            </div>

            {/* Top Drivers & Fuel by Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Top Drivers */}
              <div className="data-table-container p-4 sm:p-6">
                <h2 className="text-sm sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Top conducteurs</h2>
                <div className="space-y-2 sm:space-y-3">
                  {data.top_drivers.length > 0 ? (
                    data.top_drivers.map((driver) => (
                      <div
                        key={driver.driver_id}
                        className="data-card flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                          <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0"
                            style={{ backgroundColor: '#B87333' }}
                          >
                            {driver.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs sm:text-sm truncate">{driver.name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">{driver.trips} trajets</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="font-semibold text-xs sm:text-sm" style={{ color: '#6A8A82' }}>
                            {driver.distance.toFixed(0)} km
                          </p>
                          {driver.incidents > 0 && (
                            <p className="text-[10px] sm:text-xs text-red-500">{driver.incidents} incidents</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-500 text-center py-3 sm:py-4">Aucune donnée</p>
                  )}
                </div>
              </div>

              {/* Fuel by Type */}
              <div className="data-table-container p-4 sm:p-6">
                <h2 className="text-sm sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Carburant par type</h2>
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { key: 'gasoline', label: 'Essence', icon: '\u26FD', color: '#6A8A82' },
                    { key: 'diesel', label: 'Diesel', icon: '\uD83D\uDEE2\uFE0F', color: '#B87333' },
                    { key: 'electric', label: '\u00C9lectrique', icon: '\u26A1', color: '#3B82F6' },
                  ].map((type) => {
                    const typeData = data.fuel_by_type[type.key as keyof typeof data.fuel_by_type];
                    const totalCost = data.stats.fuel_cost.value || 1;
                    const percentage = (typeData.cost / totalCost) * 100;

                    return (
                      <div key={type.key} className="flex items-center space-x-2 sm:space-x-3">
                        <div className="text-lg sm:text-2xl w-7 sm:w-10">{type.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[10px] sm:text-sm mb-0.5 sm:mb-1">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-gray-500">{typeData.count} pleins</span>
                          </div>
                          <div className="h-1.5 sm:h-2 rounded-full overflow-hidden bg-gray-100">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${percentage}%`, backgroundColor: type.color }}
                            />
                          </div>
                        </div>
                        <div className="text-right w-14 sm:w-20 flex-shrink-0">
                          <p className="font-semibold text-xs sm:text-sm" style={{ color: type.color }}>
                            {typeData.cost.toFixed(0)} {currencySymbol}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-400">{typeData.quantity.toFixed(0)}L</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="data-table-container p-4 sm:p-8">
                <h2 className="text-base sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Résumé des performances</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <div className="data-card p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5 sm:mb-1 font-medium">Conso. moyenne</p>
                    <p className="text-lg sm:text-2xl font-semibold" style={{ color: '#6A8A82' }}>{data.stats.avg_consumption.value.toFixed(1)} <span className="text-xs sm:text-base text-gray-400">L/100</span></p>
                    <div className="flex items-center mt-1.5 sm:mt-2 text-[10px] sm:text-sm">
                      <span className={data.stats.avg_consumption.change <= 0 ? 'text-green-500' : 'text-amber-500'}>
                        {data.stats.avg_consumption.change <= 0 ? '↓' : '↑'} {Math.abs(data.stats.avg_consumption.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="data-card p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5 sm:mb-1 font-medium">Disponibilité</p>
                    <p className="text-lg sm:text-2xl font-semibold" style={{ color: '#6A8A82' }}>{data.stats.availability.value.toFixed(0)}%</p>
                    <p className="text-[9px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">{data.fleet.total_vehicles} véhicules</p>
                  </div>
                  <div className="data-card p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5 sm:mb-1 font-medium">Incidents</p>
                    <p className="text-lg sm:text-2xl font-semibold" style={{ color: '#B87333' }}>{data.stats.incidents.value}</p>
                    <div className="flex items-center mt-1.5 sm:mt-2 text-[10px] sm:text-sm">
                      <span className={data.stats.incidents.change <= 0 ? 'text-green-500' : 'text-red-400'}>
                        {data.stats.incidents.change <= 0 ? '↓' : '↑'} {Math.abs(data.stats.incidents.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="data-card p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5 sm:mb-1 font-medium">Conducteurs actifs</p>
                    <p className="text-lg sm:text-2xl font-semibold" style={{ color: '#6A8A82' }}>{data.fleet.total_drivers}</p>
                    <p className="text-[9px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">{data.top_drivers.length} dans le top</p>
                  </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
