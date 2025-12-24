import React, { useState } from 'react';
import { base44, DPCPractice } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Phone, Mail, Globe, User, Building2, Search, CheckCircle2, Filter, X, GitCompare, DollarSign } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import PracticeComparison from '../components/directory/PracticeComparison';

const STATES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

export default function DPCDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [insuranceFilter, setInsuranceFilter] = useState('all');
  const [practiceTypeFilter, setPracticeTypeFilter] = useState('all');
  const [patientCapacityFilter, setPatientCapacityFilter] = useState('all');
  const [servicesFilter, setServicesFilter] = useState<string[]>([]);
  const [feeRange, setFeeRange] = useState([0, 500]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<DPCPractice[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const { data: practices = [], isLoading } = useQuery({
    queryKey: ['dpc-practices'],
    queryFn: () => base44.entities.DPCPractice.list('-created_date', 500)
  });

  // Get unique cities
  const uniqueCities = React.useMemo(() => {
    const cities = new Set<string>();
    practices.forEach(p => {
      if (p.city) cities.add(p.city);
    });
    return Array.from(cities).sort();
  }, [practices]);

  // Filter practices
  const filteredPractices = practices.filter(practice => {
    const matchesSearch = !searchQuery || 
      practice.practice_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      practice.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesState = selectedState === 'all' || practice.state === selectedState;
    const matchesCity = cityFilter === 'all' || practice.city === cityFilter;
    const matchesInsurance = insuranceFilter === 'all' || 
                             (insuranceFilter === 'yes' && practice.accepts_insurance) ||
                             (insuranceFilter === 'no' && !practice.accepts_insurance);
    
    const matchesPracticeType = practiceTypeFilter === 'all' || practice.practice_type === practiceTypeFilter;
    const matchesPatientCapacity = patientCapacityFilter === 'all' || practice.patient_capacity === patientCapacityFilter;
    
    // Services filter
    const matchesServices = servicesFilter.length === 0 || 
                           (practice.services_offered && servicesFilter.every(s => practice.services_offered!.includes(s)));
    
    // Fee range filter
    let matchesFee = true;
    if (practice.membership_fee_min !== undefined && practice.membership_fee_max !== undefined) {
      matchesFee = practice.membership_fee_max >= feeRange[0] && practice.membership_fee_min <= feeRange[1];
    }
    
    return matchesSearch && matchesState && matchesCity && matchesInsurance && matchesPracticeType && matchesPatientCapacity && matchesServices && matchesFee;
  });

  // Group by state
  const practicesByState: Record<string, typeof practices> = {};
  filteredPractices.forEach(practice => {
    const state = practice.state || 'Other';
    if (!practicesByState[state]) {
      practicesByState[state] = [];
    }
    practicesByState[state].push(practice);
  });

  const sortedStates = Object.keys(practicesByState).sort();

  const togglePracticeSelection = (practice: DPCPractice) => {
    setSelectedForComparison(prev => {
      const isSelected = prev.find(p => p.id === practice.id);
      if (isSelected) {
        return prev.filter(p => p.id !== practice.id);
      } else {
        if (prev.length >= 5) {
          alert('You can compare up to 5 practices at once');
          return prev;
        }
        return [...prev, practice];
      }
    });
  };

  const clearComparison = () => {
    setSelectedForComparison([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="DPC Practice Directory"
        description="Find Direct Primary Care practices across the United States with contact information and membership details."
        keywords="DPC directory, direct primary care practices, find DPC doctor, DPC near me"
      />
      <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          {/* Comparison Bar */}
          <AnimatePresence>
            {selectedForComparison.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed bottom-0 left-0 right-0 bg-teal-600 text-white shadow-2xl z-[60] border-t-4 border-teal-700"
              >
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                    <GitCompare className="h-5 w-5" />
                    <span className="font-semibold">
                      {selectedForComparison.length} practice{selectedForComparison.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {selectedForComparison.map(practice => (
                        <Badge key={practice.id} className="bg-white text-teal-700">
                          {practice.practice_name}
                          <button
                            onClick={() => togglePracticeSelection(practice)}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowComparison(true)}
                      className="bg-white text-teal-700 hover:bg-teal-50"
                    >
                      <GitCompare className="mr-2 h-4 w-4" />
                      Compare Now
                    </Button>
                    <Button
                      onClick={clearComparison}
                      variant="outline"
                      className="border-white bg-white text-teal-700 hover:bg-teal-50"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comparison Modal */}
          {showComparison && (
            <PracticeComparison
              practices={selectedForComparison}
              onClose={() => setShowComparison(false)}
            />
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
              DPC Practice Directory
            </h1>
            <p className="text-lg text-slate-600 mb-6">
              Find Direct Primary Care practices across the United States. Connect directly with practices 
              offering membership-based primary care without insurance billing.
            </p>

            {/* Search and Filter Toggle */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by practice name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="md:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
                {(selectedState !== 'all' || cityFilter !== 'all' || insuranceFilter !== 'all' || practiceTypeFilter !== 'all' || patientCapacityFilter !== 'all' || servicesFilter.length > 0 || feeRange[0] !== 0 || feeRange[1] !== 500) && (
                  <span className="ml-2 bg-teal-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {[
                      selectedState !== 'all',
                      cityFilter !== 'all',
                      insuranceFilter !== 'all',
                      practiceTypeFilter !== 'all',
                      patientCapacityFilter !== 'all',
                      servicesFilter.length > 0,
                      feeRange[0] !== 0 || feeRange[1] !== 500
                    ].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Card className="shadow-2xl border-2 border-slate-200/80 bg-white overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500"></div>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* State Filter */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">State</Label>
                        <Select value={selectedState} onValueChange={setSelectedState}>
                          <SelectTrigger>
                            <SelectValue placeholder="All States" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="all">All States</SelectItem>
                            {Object.entries(STATES).map(([code, name]) => (
                              <SelectItem key={code} value={code}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* City Filter */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">City</Label>
                        <Select value={cityFilter} onValueChange={setCityFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Cities" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="all">All Cities</SelectItem>
                            {uniqueCities.map(city => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Insurance Filter */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Accepts Insurance</Label>
                        <Select value={insuranceFilter} onValueChange={setInsuranceFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Practices" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Practices</SelectItem>
                            <SelectItem value="yes">Accepts Insurance</SelectItem>
                            <SelectItem value="no">DPC Only (No Insurance)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Practice Type Filter */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Practice Type</Label>
                        <Select value={practiceTypeFilter} onValueChange={setPracticeTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="dpc_only">DPC Only</SelectItem>
                            <SelectItem value="hybrid_dpc">Hybrid DPC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Patient Capacity Filter */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Patient Capacity</Label>
                        <Select value={patientCapacityFilter} onValueChange={setPatientCapacityFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Capacities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Capacities</SelectItem>
                            <SelectItem value="accepting_new">Accepting New Patients</SelectItem>
                            <SelectItem value="limited_capacity">Limited Capacity</SelectItem>
                            <SelectItem value="full">Full</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Membership Fee Range */}
                      <div className="lg:col-span-4">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Monthly Membership Fee Range: ${feeRange[0]} - ${feeRange[1]}
                        </Label>
                        <Slider
                          min={0}
                          max={500}
                          step={10}
                          value={feeRange}
                          onValueChange={setFeeRange}
                          className="mt-3"
                        />
                      </div>

                      {/* Services Offered */}
                      <div className="lg:col-span-4">
                        <Label className="text-sm font-semibold text-slate-700 mb-3 block">Services Offered</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {[
                            'Primary Care',
                            'Telemedicine',
                            'Lab Services',
                            'Minor Procedures',
                            'Chronic Disease Management',
                            'Preventive Care',
                            'Weight Management',
                            'Mental Health',
                            'Pediatrics',
                            "Women's Health",
                            'Sports Medicine',
                            'Urgent Care'
                          ].map(service => (
                            <div key={service} className="flex items-center space-x-2">
                              <Checkbox
                                id={service}
                                checked={servicesFilter.includes(service)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setServicesFilter([...servicesFilter, service]);
                                  } else {
                                    setServicesFilter(servicesFilter.filter(s => s !== service));
                                  }
                                }}
                              />
                              <label
                                htmlFor={service}
                                className="text-sm text-slate-700 cursor-pointer"
                              >
                                {service}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {(selectedState !== 'all' || cityFilter !== 'all' || insuranceFilter !== 'all' || practiceTypeFilter !== 'all' || patientCapacityFilter !== 'all' || servicesFilter.length > 0 || feeRange[0] !== 0 || feeRange[1] !== 500) && (
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedState('all');
                            setCityFilter('all');
                            setInsuranceFilter('all');
                            setPracticeTypeFilter('all');
                            setPatientCapacityFilter('all');
                            setServicesFilter([]);
                            setFeeRange([0, 500]);
                          }}
                          className="w-full md:w-auto"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Summary Stats */}
          {practices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid md:grid-cols-3 gap-6 mb-8"
            >
              <Card className="shadow-xl border-2 border-teal-200/60 bg-gradient-to-br from-teal-50 to-white overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-teal-700">Total Practices</div>
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-teal-600" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-teal-600">
                    {practices.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Across {Object.keys(practicesByState).length} states
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-2 border-green-200/60 bg-gradient-to-br from-green-50 to-white overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-green-700">Verified Practices</div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-green-600">
                    {practices.filter(p => p.verified).length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Contact info verified
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-2 border-blue-200/60 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-blue-700">Search Results</div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Search className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-blue-600">
                    {filteredPractices.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Matching your filters
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Practices List */}
          {filteredPractices.length === 0 ? (
            <Card className="shadow-lg border-slate-200">
              <CardContent className="pt-12 pb-12 text-center">
                <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {practices.length === 0 ? 'No practices listed yet' : 'No practices found'}
                </h3>
                <p className="text-slate-600 mb-4">
                  {practices.length === 0 
                    ? 'Check back soon as we build our directory of DPC practices.'
                    : 'Try adjusting your search or filter criteria.'}
                </p>
                {searchQuery || selectedState !== 'all' || cityFilter !== 'all' || insuranceFilter !== 'all' || practiceTypeFilter !== 'all' || patientCapacityFilter !== 'all' || servicesFilter.length > 0 ? (
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedState('all');
                      setCityFilter('all');
                      setInsuranceFilter('all');
                      setPracticeTypeFilter('all');
                      setPatientCapacityFilter('all');
                      setServicesFilter([]);
                      setFeeRange([0, 500]);
                    }}
                    variant="outline"
                  >
                    Clear filters
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {sortedStates.map((stateCode, stateIndex) => (
                <motion.div
                  key={stateCode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stateIndex * 0.05 }}
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-teal-600" />
                    {STATES[stateCode as keyof typeof STATES] || stateCode}
                    <Badge variant="outline" className="ml-2">
                      {practicesByState[stateCode].length} practice{practicesByState[stateCode].length !== 1 ? 's' : ''}
                    </Badge>
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {practicesByState[stateCode].map((practice, practiceIndex) => (
                      <motion.div
                        key={practice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (stateIndex * 0.05) + (practiceIndex * 0.03) }}
                      >
                        <Card className={`shadow-2xl border-2 hover:shadow-2xl transition-all duration-300 h-full overflow-hidden ${
                          selectedForComparison.find(p => p.id === practice.id) 
                            ? 'border-teal-400 bg-teal-50/50' 
                            : practice.verified
                            ? 'border-green-200 bg-gradient-to-br from-green-50/30 to-white'
                            : 'border-slate-200 hover:border-teal-300'
                        }`}>
                          <div className={`absolute top-0 left-0 right-0 h-1 ${
                            practice.verified 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'bg-gradient-to-r from-slate-300 to-slate-400'
                          }`}></div>
                          
                          <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <CardTitle className="text-xl mb-2 flex items-start gap-2">
                                  {practice.practice_name}
                                  {practice.verified && (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                  )}
                                </CardTitle>
                                {practice.provider_name && (
                                  <div className="flex items-center gap-2 text-slate-600 text-sm mb-3">
                                    <User className="h-4 w-4" />
                                    <span>{practice.provider_name}</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant={selectedForComparison.find(p => p.id === practice.id) ? "default" : "outline"}
                                size="sm"
                                onClick={() => togglePracticeSelection(practice)}
                                className={selectedForComparison.find(p => p.id === practice.id) ? "bg-teal-600 hover:bg-teal-700" : ""}
                              >
                                <GitCompare className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Location */}
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium">{practice.city}, {practice.state}</div>
                                {practice.address && (
                                  <div className="text-sm text-slate-600">{practice.address}</div>
                                )}
                                {practice.zip_code && (
                                  <div className="text-sm text-slate-600">{practice.zip_code}</div>
                                )}
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2">
                              {practice.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-slate-500" />
                                  <a href={`tel:${practice.phone}`} className="text-teal-600 hover:underline">
                                    {practice.phone}
                                  </a>
                                </div>
                              )}
                              {practice.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-slate-500" />
                                  <a href={`mailto:${practice.email}`} className="text-teal-600 hover:underline">
                                    {practice.email}
                                  </a>
                                </div>
                              )}
                              {practice.website && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Globe className="h-4 w-4 text-slate-500" />
                                  <a href={practice.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                                    Visit Website
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Membership Fee */}
                            {practice.membership_fee_min !== undefined && practice.membership_fee_max !== undefined && (
                              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                <DollarSign className="h-5 w-5 text-blue-600" />
                                <div>
                                  <div className="text-sm text-slate-600">Monthly Membership</div>
                                  <div className="font-semibold text-blue-700">
                                    ${practice.membership_fee_min} - ${practice.membership_fee_max}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                              {practice.accepts_insurance && (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                                  Accepts Insurance
                                </Badge>
                              )}
                              {practice.practice_type && (
                                <Badge variant="outline">
                                  {practice.practice_type === 'dpc_only' ? 'DPC Only' : 'Hybrid DPC'}
                                </Badge>
                              )}
                              {practice.patient_capacity && (
                                <Badge variant={
                                  practice.patient_capacity === 'accepting_new' ? 'default' :
                                  practice.patient_capacity === 'limited_capacity' ? 'secondary' : 'destructive'
                                }>
                                  {practice.patient_capacity === 'accepting_new' ? 'Accepting New Patients' :
                                   practice.patient_capacity === 'limited_capacity' ? 'Limited Capacity' : 'Full'}
                                </Badge>
                              )}
                            </div>

                            {/* Services */}
                            {practice.services_offered && practice.services_offered.length > 0 && (
                              <div>
                                <div className="text-sm font-semibold text-slate-700 mb-2">Services Offered</div>
                                <div className="flex flex-wrap gap-1">
                                  {practice.services_offered.map((service, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {service}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
