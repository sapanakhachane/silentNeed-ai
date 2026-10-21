import React, { useState } from 'react';
import { X, Sparkles, Building, Droplets, MapPin } from 'lucide-react';
import { createCommunity, addCommunityIndicator } from '../services/api';

export default function AddCommunityModal({ isOpen, onClose, onCommunityAdded }) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: `COMM-${Math.floor(1000 + Math.random() * 9000)}`,
    ward_number: 'Ward 44',
    district: 'Metro East',
    state: 'State North',
    zone_type: 'Informal Settlement / Slum',
    latitude: 28.6300,
    longitude: 77.2100,
    population: 6500,
    households: 1300,
    median_income_monthly: 8500,
    digital_literacy_rate: 24.0,
    internet_penetration_rate: 28.0,
    distance_to_gov_office_km: 10.5,
    primary_language: 'Local Dialect',
    // Indicators
    water_access_hours_per_day: 1.0,
    water_contamination_index: 82.0,
    water_source_type: 'Contaminated Handpump',
    road_condition_index: 25.0,
    pothole_density_per_km: 16.0,
    public_transit_access_score: 20.0,
    garbage_collection_per_week: 0.5,
    waste_overflow_rate: 85.0,
    open_drainage_percentage: 90.0,
    power_outage_hours_per_week: 40.0,
    voltage_fluctuation_severity: 75.0,
    street_light_operational_pct: 15.0,
    distance_to_nearest_phc_km: 8.5,
    doctor_availability_score: 15.0,
    infant_immunization_rate: 45.0,
    flood_vulnerability_index: 80.0,
    drainage_blockage_percentage: 85.0,
    waterlogging_days_per_year: 45.0,
    ration_shop_queue_hours: 4.5,
    csc_service_center_dist_km: 7.5,
    official_complaints_registered_90d: 2 // The Silent Need trigger
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Community
      const commPayload = {
        name: formData.name,
        code: formData.code,
        ward_number: formData.ward_number,
        district: formData.district,
        state: formData.state,
        zone_type: formData.zone_type,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        population: Number(formData.population),
        households: Number(formData.households),
        median_income_monthly: Number(formData.median_income_monthly),
        digital_literacy_rate: Number(formData.digital_literacy_rate),
        internet_penetration_rate: Number(formData.internet_penetration_rate),
        distance_to_gov_office_km: Number(formData.distance_to_gov_office_km),
        primary_language: formData.primary_language
      };

      const newComm = await createCommunity(commPayload);

      // 2. Add Indicator and trigger AI Evaluation
      const indPayload = {
        water_access_hours_per_day: Number(formData.water_access_hours_per_day),
        water_contamination_index: Number(formData.water_contamination_index),
        water_source_type: formData.water_source_type,
        road_condition_index: Number(formData.road_condition_index),
        pothole_density_per_km: Number(formData.pothole_density_per_km),
        public_transit_access_score: Number(formData.public_transit_access_score),
        garbage_collection_per_week: Number(formData.garbage_collection_per_week),
        waste_overflow_rate: Number(formData.waste_overflow_rate),
        open_drainage_percentage: Number(formData.open_drainage_percentage),
        power_outage_hours_per_week: Number(formData.power_outage_hours_per_week),
        voltage_fluctuation_severity: Number(formData.voltage_fluctuation_severity),
        street_light_operational_pct: Number(formData.street_light_operational_pct),
        distance_to_nearest_phc_km: Number(formData.distance_to_nearest_phc_km),
        doctor_availability_score: Number(formData.doctor_availability_score),
        infant_immunization_rate: Number(formData.infant_immunization_rate),
        flood_vulnerability_index: Number(formData.flood_vulnerability_index),
        drainage_blockage_percentage: Number(formData.drainage_blockage_percentage),
        waterlogging_days_per_year: Number(formData.waterlogging_days_per_year),
        ration_shop_queue_hours: Number(formData.ration_shop_queue_hours),
        csc_service_center_dist_km: Number(formData.csc_service_center_dist_km),
        official_complaints_registered_90d: Number(formData.official_complaints_registered_90d)
      };

      await addCommunityIndicator(newComm.id, indPayload);

      onCommunityAdded();
      onClose();
    } catch (err) {
      alert("Error adding community: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Register Community & Field Audit Data</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Section 1: Demographics */}
          <div className="space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">
              1. Geographic & Demographic Profile
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Community / Settlement Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohini Sector 29 Resettlement"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Zone Type</label>
                <select
                  name="zone_type"
                  value={formData.zone_type}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                >
                  <option value="Informal Settlement / Slum">Informal Settlement / Slum</option>
                  <option value="Peri-Urban Factory Belt">Peri-Urban Factory Belt</option>
                  <option value="Riverine Floodplain">Riverine Floodplain</option>
                  <option value="Rural Migrant Cluster">Rural Migrant Cluster</option>
                  <option value="Dense Historic Urban Village">Dense Historic Urban Village</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Population</label>
                <input
                  type="number"
                  name="population"
                  value={formData.population}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Digital Literacy %</label>
                <input
                  type="number"
                  step="0.1"
                  name="digital_literacy_rate"
                  value={formData.digital_literacy_rate}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Public Service Indicators */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">
              2. Public Service Field Indicators (7 Sectors)
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <label className="text-slate-400 block mb-1">Water Hours / Day</label>
                <input
                  type="number"
                  step="0.1"
                  name="water_access_hours_per_day"
                  value={formData.water_access_hours_per_day}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5"
                />
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <label className="text-slate-400 block mb-1">Water Contam Index (0-100)</label>
                <input
                  type="number"
                  name="water_contamination_index"
                  value={formData.water_contamination_index}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5"
                />
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <label className="text-slate-400 block mb-1">Road Condition (0-100)</label>
                <input
                  type="number"
                  name="road_condition_index"
                  value={formData.road_condition_index}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <label className="text-slate-400 block mb-1">Garbage Pickup / Wk</label>
                <input
                  type="number"
                  step="0.1"
                  name="garbage_collection_per_week"
                  value={formData.garbage_collection_per_week}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5"
                />
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <label className="text-slate-400 block mb-1">Power Outages (Hrs/Wk)</label>
                <input
                  type="number"
                  name="power_outage_hours_per_week"
                  value={formData.power_outage_hours_per_week}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5"
                />
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <label className="text-slate-400 block mb-1">PHC Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  name="distance_to_nearest_phc_km"
                  value={formData.distance_to_nearest_phc_km}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <label className="text-slate-400 block mb-1">Flood Vulnerability (0-100)</label>
                <input
                  type="number"
                  name="flood_vulnerability_index"
                  value={formData.flood_vulnerability_index}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5"
                />
              </div>
              <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                <label className="text-rose-300 block mb-1 font-semibold">
                  Official Complaints (Last 90 Days)
                </label>
                <input
                  type="number"
                  name="official_complaints_registered_90d"
                  value={formData.official_complaints_registered_90d}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-rose-600 text-amber-300 font-bold rounded-lg p-1.5"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Keep low (0-5) to test the Silent Need AI detection paradox!
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-cyan-900/30 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Run AI Risk Evaluation & Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
