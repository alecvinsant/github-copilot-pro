import React from 'react';
import { DPCPractice } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MapPin, Phone, Mail, Globe, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PracticeComparisonProps {
  practices: DPCPractice[];
  onClose: () => void;
}

export default function PracticeComparison({ practices, onClose }: PracticeComparisonProps) {
  if (practices.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="sticky top-0 bg-white border-b z-10">
          <div className="flex items-center justify-between">
            <CardTitle>Practice Comparison</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  {practices.map(practice => (
                    <th key={practice.id} className="text-left p-4 font-semibold min-w-[200px]">
                      {practice.practice_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium">Location</td>
                  {practices.map(practice => (
                    <td key={practice.id} className="p-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                        <div>
                          <div>{practice.city}, {practice.state}</div>
                          {practice.address && <div className="text-sm text-slate-600">{practice.address}</div>}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium">Provider</td>
                  {practices.map(practice => (
                    <td key={practice.id} className="p-4">
                      {practice.provider_name || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium">Contact</td>
                  {practices.map(practice => (
                    <td key={practice.id} className="p-4">
                      <div className="space-y-1">
                        {practice.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-slate-500" />
                            <span>{practice.phone}</span>
                          </div>
                        )}
                        {practice.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-slate-500" />
                            <span>{practice.email}</span>
                          </div>
                        )}
                        {practice.website && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-3 w-3 text-slate-500" />
                            <a href={practice.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium">Membership Fee</td>
                  {practices.map(practice => (
                    <td key={practice.id} className="p-4">
                      {practice.membership_fee_min !== undefined && practice.membership_fee_max !== undefined ? (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-slate-500" />
                          <span>${practice.membership_fee_min} - ${practice.membership_fee_max}/mo</span>
                        </div>
                      ) : 'Contact for pricing'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium">Accepts Insurance</td>
                  {practices.map(practice => (
                    <td key={practice.id} className="p-4">
                      {practice.accepts_insurance ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500">
                          <XCircle className="h-4 w-4" />
                          <span>DPC Only</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium">Practice Type</td>
                  {practices.map(practice => (
                    <td key={practice.id} className="p-4">
                      {practice.practice_type === 'dpc_only' ? 'DPC Only' : 'Hybrid DPC'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium">Patient Capacity</td>
                  {practices.map(practice => (
                    <td key={practice.id} className="p-4">
                      <Badge variant={
                        practice.patient_capacity === 'accepting_new' ? 'default' :
                        practice.patient_capacity === 'limited_capacity' ? 'secondary' : 'destructive'
                      }>
                        {practice.patient_capacity === 'accepting_new' ? 'Accepting New Patients' :
                         practice.patient_capacity === 'limited_capacity' ? 'Limited Capacity' : 'Full'}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium">Services Offered</td>
                  {practices.map(practice => (
                    <td key={practice.id} className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {practice.services_offered?.map((service, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-medium">Verified</td>
                  {practices.map(practice => (
                    <td key={practice.id} className="p-4">
                      {practice.verified ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Not verified</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
