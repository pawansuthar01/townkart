"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  Settings,
  Save,
  RefreshCw,
} from "lucide-react";
import {
  DeliveryChargeConfig,
  DeliveryZone,
  deliveryChargeManager,
  calculateDeliveryCharge,
} from "@/lib/deliveryCharges";

export function DeliveryChargeManager() {
  const [config, setConfig] = useState<DeliveryChargeConfig>(
    deliveryChargeManager.getConfig(),
  );
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [zoneStats, setZoneStats] = useState<any[]>([]);
  const [surgeAnalytics, setSurgeAnalytics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setZoneStats(deliveryChargeManager.getZoneStats());
    setSurgeAnalytics(deliveryChargeManager.getSurgeAnalytics());
  };

  const handleSaveConfig = () => {
    deliveryChargeManager.updateConfig(config);
    setIsEditing(false);
  };

  const handleAddZone = (zoneData: Partial<DeliveryZone>) => {
    const newZone: DeliveryZone = {
      id: `zone_${Date.now()}`,
      name: zoneData.name || "",
      coordinates: zoneData.coordinates || [],
      baseCharge: zoneData.baseCharge || 0,
      perKmCharge: zoneData.perKmCharge || 0,
      minimumCharge: zoneData.minimumCharge || 0,
      maximumCharge: zoneData.maximumCharge,
      freeDeliveryThreshold: zoneData.freeDeliveryThreshold,
      estimatedDeliveryTime: zoneData.estimatedDeliveryTime || 30,
      isActive: true,
    };

    deliveryChargeManager.addZone(newZone);
    setConfig(deliveryChargeManager.getConfig());
    setShowAddZone(false);
    loadData();
  };

  const handleUpdateZone = (zoneId: string, updates: Partial<DeliveryZone>) => {
    deliveryChargeManager.updateZone(zoneId, updates);
    setConfig(deliveryChargeManager.getConfig());
    setSelectedZone(null);
    loadData();
  };

  const handleDeleteZone = (zoneId: string) => {
    deliveryChargeManager.removeZone(zoneId);
    setConfig(deliveryChargeManager.getConfig());
    loadData();
  };

  const calculateTestCharge = () => {
    const testInput = {
      pickupLocation: { latitude: 12.9716, longitude: 77.5946 },
      deliveryLocation: { latitude: 12.9816, longitude: 77.6046 },
      orderValue: 500,
      weight: 2,
      priority: "standard" as const,
    };

    return calculateDeliveryCharge(testInput, config);
  };

  const testResult = calculateTestCharge();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Charge Management
          </h2>
          <p className="text-gray-600">
            Configure delivery zones, pricing, and surge charges
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="zones" className="space-y-6">
        <TabsList>
          <TabsTrigger value="zones">Delivery Zones</TabsTrigger>
          <TabsTrigger value="pricing">Global Pricing</TabsTrigger>
          <TabsTrigger value="surge">Surge Pricing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Delivery Zones Tab */}
        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Zones
                </CardTitle>
                <Dialog open={showAddZone} onOpenChange={setShowAddZone}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Zone
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Delivery Zone</DialogTitle>
                    </DialogHeader>
                    <AddZoneForm onSubmit={handleAddZone} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.zones.map((zone) => (
                  <Card key={zone.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{zone.name}</CardTitle>
                        <Badge
                          variant={zone.isActive ? "default" : "secondary"}
                        >
                          {zone.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Base:</span>
                          <span className="font-medium ml-1">
                            ₹{zone.baseCharge}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Per Km:</span>
                          <span className="font-medium ml-1">
                            ₹{zone.perKmCharge}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Min:</span>
                          <span className="font-medium ml-1">
                            ₹{zone.minimumCharge}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Free @:</span>
                          <span className="font-medium ml-1">
                            ₹{zone.freeDeliveryThreshold}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{zone.estimatedDeliveryTime} min delivery</span>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedZone(zone)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Delivery Zone</DialogTitle>
                            </DialogHeader>
                            {selectedZone && (
                              <EditZoneForm
                                zone={selectedZone}
                                onSubmit={(updates) =>
                                  handleUpdateZone(zone.id, updates)
                                }
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteZone(zone.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Global Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Global Pricing Settings
                </CardTitle>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleSaveConfig}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Default Charges</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="defaultBaseCharge">Base Charge (₹)</Label>
                      <Input
                        id="defaultBaseCharge"
                        type="number"
                        value={config.defaultBaseCharge}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            defaultBaseCharge: Number(e.target.value),
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultPerKmCharge">
                        Per Km Charge (₹)
                      </Label>
                      <Input
                        id="defaultPerKmCharge"
                        type="number"
                        value={config.defaultPerKmCharge}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            defaultPerKmCharge: Number(e.target.value),
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultMinimumCharge">
                        Minimum Charge (₹)
                      </Label>
                      <Input
                        id="defaultMinimumCharge"
                        type="number"
                        value={config.defaultMinimumCharge}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            defaultMinimumCharge: Number(e.target.value),
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Free Delivery</h3>
                  <div>
                    <Label htmlFor="freeDeliveryThreshold">
                      Free Delivery Threshold (₹)
                    </Label>
                    <Input
                      id="freeDeliveryThreshold"
                      type="number"
                      value={config.freeDeliveryThreshold}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          freeDeliveryThreshold: Number(e.target.value),
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Test Calculation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Calculation</h3>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium ml-1">
                          {testResult.estimatedDistance.toFixed(1)} km
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Base:</span>
                        <span className="font-medium ml-1">
                          ₹{testResult.baseCharge}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium ml-1">
                          ₹{testResult.distanceCharge}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold text-green-600 ml-1">
                          ₹{testResult.totalCharge}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Surge Pricing Tab */}
        <TabsContent value="surge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Surge Pricing Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="surgeEnabled">Enable Surge Pricing</Label>
                  <p className="text-sm text-gray-600">
                    Automatically increase prices during peak hours
                  </p>
                </div>
                <Switch
                  id="surgeEnabled"
                  checked={config.surgePricingEnabled}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      surgePricingEnabled: checked,
                    })
                  }
                  disabled={!isEditing}
                />
              </div>

              {config.surgePricingEnabled && (
                <>
                  <div>
                    <Label htmlFor="surgeMultiplier">Surge Multiplier</Label>
                    <Input
                      id="surgeMultiplier"
                      type="number"
                      step="0.1"
                      value={config.surgeMultiplier}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          surgeMultiplier: Number(e.target.value),
                        })
                      }
                      disabled={!isEditing}
                      className="w-32"
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Peak Hours</h4>
                    {config.peakHours.map((peak, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {peak.start} - {peak.end}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Multiplier:</span>
                          <Badge>{peak.multiplier}x</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Special Days</h4>
                    {config.specialDays.map((day, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{day.date}</span>
                          <span className="text-gray-600">
                            ({day.description})
                          </span>
                        </div>
                        <Badge>{day.multiplier}x</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Zone Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone</TableHead>
                      <TableHead>Deliveries</TableHead>
                      <TableHead>Avg Charge</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zoneStats.map((stat) => (
                      <TableRow key={stat.zone.id}>
                        <TableCell className="font-medium">
                          {stat.zone.name}
                        </TableCell>
                        <TableCell>{stat.deliveryCount}</TableCell>
                        <TableCell>₹{stat.averageCharge}</TableCell>
                        <TableCell>₹{stat.totalRevenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Surge Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {surgeAnalytics && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Current Surge Multiplier:</span>
                      <Badge variant="outline">
                        {surgeAnalytics.currentMultiplier}x
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Peak Hours Activity</h4>
                      {surgeAnalytics.peakHours.map(
                        (peak: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{peak.time}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {peak.multiplier}x
                              </Badge>
                              <span className="text-gray-600">
                                {peak.activeDeliveries} active
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add Zone Form Component
function AddZoneForm({
  onSubmit,
}: {
  onSubmit: (zone: Partial<DeliveryZone>) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    baseCharge: 0,
    perKmCharge: 0,
    minimumCharge: 0,
    maximumCharge: 0,
    freeDeliveryThreshold: 0,
    estimatedDeliveryTime: 30,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="zoneName">Zone Name</Label>
        <Input
          id="zoneName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="baseCharge">Base Charge (₹)</Label>
          <Input
            id="baseCharge"
            type="number"
            value={formData.baseCharge}
            onChange={(e) =>
              setFormData({ ...formData, baseCharge: Number(e.target.value) })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="perKmCharge">Per Km Charge (₹)</Label>
          <Input
            id="perKmCharge"
            type="number"
            value={formData.perKmCharge}
            onChange={(e) =>
              setFormData({ ...formData, perKmCharge: Number(e.target.value) })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minimumCharge">Minimum Charge (₹)</Label>
          <Input
            id="minimumCharge"
            type="number"
            value={formData.minimumCharge}
            onChange={(e) =>
              setFormData({
                ...formData,
                minimumCharge: Number(e.target.value),
              })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="maximumCharge">Maximum Charge (₹)</Label>
          <Input
            id="maximumCharge"
            type="number"
            value={formData.maximumCharge}
            onChange={(e) =>
              setFormData({
                ...formData,
                maximumCharge: Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="freeDeliveryThreshold">
            Free Delivery Threshold (₹)
          </Label>
          <Input
            id="freeDeliveryThreshold"
            type="number"
            value={formData.freeDeliveryThreshold}
            onChange={(e) =>
              setFormData({
                ...formData,
                freeDeliveryThreshold: Number(e.target.value),
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="estimatedDeliveryTime">
            Estimated Delivery Time (min)
          </Label>
          <Input
            id="estimatedDeliveryTime"
            type="number"
            value={formData.estimatedDeliveryTime}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimatedDeliveryTime: Number(e.target.value),
              })
            }
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Add Zone
      </Button>
    </form>
  );
}

// Edit Zone Form Component
function EditZoneForm({
  zone,
  onSubmit,
}: {
  zone: DeliveryZone;
  onSubmit: (updates: Partial<DeliveryZone>) => void;
}) {
  const [formData, setFormData] = useState({
    name: zone.name,
    baseCharge: zone.baseCharge,
    perKmCharge: zone.perKmCharge,
    minimumCharge: zone.minimumCharge,
    maximumCharge: zone.maximumCharge || 0,
    freeDeliveryThreshold: zone.freeDeliveryThreshold || 0,
    estimatedDeliveryTime: zone.estimatedDeliveryTime,
    isActive: zone.isActive,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="editZoneName">Zone Name</Label>
        <Input
          id="editZoneName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="editBaseCharge">Base Charge (₹)</Label>
          <Input
            id="editBaseCharge"
            type="number"
            value={formData.baseCharge}
            onChange={(e) =>
              setFormData({ ...formData, baseCharge: Number(e.target.value) })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="editPerKmCharge">Per Km Charge (₹)</Label>
          <Input
            id="editPerKmCharge"
            type="number"
            value={formData.perKmCharge}
            onChange={(e) =>
              setFormData({ ...formData, perKmCharge: Number(e.target.value) })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="editMinimumCharge">Minimum Charge (₹)</Label>
          <Input
            id="editMinimumCharge"
            type="number"
            value={formData.minimumCharge}
            onChange={(e) =>
              setFormData({
                ...formData,
                minimumCharge: Number(e.target.value),
              })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="editMaximumCharge">Maximum Charge (₹)</Label>
          <Input
            id="editMaximumCharge"
            type="number"
            value={formData.maximumCharge}
            onChange={(e) =>
              setFormData({
                ...formData,
                maximumCharge: Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="editFreeDeliveryThreshold">
            Free Delivery Threshold (₹)
          </Label>
          <Input
            id="editFreeDeliveryThreshold"
            type="number"
            value={formData.freeDeliveryThreshold}
            onChange={(e) =>
              setFormData({
                ...formData,
                freeDeliveryThreshold: Number(e.target.value),
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="editEstimatedDeliveryTime">
            Estimated Delivery Time (min)
          </Label>
          <Input
            id="editEstimatedDeliveryTime"
            type="number"
            value={formData.estimatedDeliveryTime}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimatedDeliveryTime: Number(e.target.value),
              })
            }
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="editIsActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <Label htmlFor="editIsActive">Zone Active</Label>
      </div>

      <Button type="submit" className="w-full">
        Update Zone
      </Button>
    </form>
  );
}
