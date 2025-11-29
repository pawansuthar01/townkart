"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Percent, Tag, Calendar, Eye, Edit, Trash2 } from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  description: string;
  type: "percentage" | "fixed" | "buy_one_get_one";
  discountValue: number;
  minimumOrder: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
}

export default function StorePromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newPromotion, setNewPromotion] = useState({
    title: "",
    description: "",
    type: "percentage" as const,
    discountValue: "",
    minimumOrder: "",
    startDate: "",
    endDate: "",
    maxUsage: "",
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      // TODO: connect to DB/API
      setPromotions([]);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePromotion = async () => {
    if (
      !newPromotion.title ||
      !newPromotion.discountValue ||
      !newPromotion.startDate ||
      !newPromotion.endDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // In a real app, this would call an API
      const promotion: Promotion = {
        id: Date.now().toString(),
        title: newPromotion.title,
        description: newPromotion.description,
        type: newPromotion.type,
        discountValue: parseFloat(newPromotion.discountValue),
        minimumOrder: parseFloat(newPromotion.minimumOrder) || 0,
        startDate: newPromotion.startDate,
        endDate: newPromotion.endDate,
        isActive: true,
        usageCount: 0,
        maxUsage: newPromotion.maxUsage
          ? parseInt(newPromotion.maxUsage)
          : undefined,
      };

      setPromotions((prev) => [...prev, promotion]);
      setIsCreateModalOpen(false);
      setNewPromotion({
        title: "",
        description: "",
        type: "percentage",
        discountValue: "",
        minimumOrder: "",
        startDate: "",
        endDate: "",
        maxUsage: "",
      });
    } catch (error) {
      console.error("Error creating promotion:", error);
    }
  };

  const togglePromotionStatus = (id: string) => {
    setPromotions((prev) =>
      prev.map((promo) =>
        promo.id === id ? { ...promo, isActive: !promo.isActive } : promo,
      ),
    );
  };

  const deletePromotion = (id: string) => {
    if (confirm("Are you sure you want to delete this promotion?")) {
      setPromotions((prev) => prev.filter((promo) => promo.id !== id));
    }
  };

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <Percent className="h-4 w-4" />;
      case "fixed":
        return <Tag className="h-4 w-4" />;
      case "buy_one_get_one":
        return <Plus className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "Percentage Discount";
      case "fixed":
        return "Fixed Amount Off";
      case "buy_one_get_one":
        return "Buy One Get One";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const activePromotions = promotions.filter((p) => p.isActive).length;
  const totalUsage = promotions.reduce((sum, p) => sum + p.usageCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Promotions & Offers
          </h1>
          <p className="text-gray-600">
            Create and manage promotional campaigns
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Promotion Title *</Label>
                <Input
                  id="title"
                  value={newPromotion.title}
                  onChange={(e) =>
                    setNewPromotion({ ...newPromotion, title: e.target.value })
                  }
                  placeholder="e.g., 20% Off on Orders Above ₹500"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPromotion.description}
                  onChange={(e) =>
                    setNewPromotion({
                      ...newPromotion,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the promotion..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="type">Promotion Type *</Label>
                <Select
                  value={newPromotion.type}
                  onValueChange={(value: any) =>
                    setNewPromotion({ ...newPromotion, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      Percentage Discount
                    </SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                    <SelectItem value="buy_one_get_one">
                      Buy One Get One
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discountValue">
                  {newPromotion.type === "percentage"
                    ? "Discount Percentage (%) *"
                    : newPromotion.type === "fixed"
                      ? "Discount Amount (₹) *"
                      : "Discount Value *"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={newPromotion.discountValue}
                  onChange={(e) =>
                    setNewPromotion({
                      ...newPromotion,
                      discountValue: e.target.value,
                    })
                  }
                  placeholder={
                    newPromotion.type === "percentage" ? "20" : "100"
                  }
                />
              </div>

              <div>
                <Label htmlFor="minimumOrder">Minimum Order Value (₹)</Label>
                <Input
                  id="minimumOrder"
                  type="number"
                  value={newPromotion.minimumOrder}
                  onChange={(e) =>
                    setNewPromotion({
                      ...newPromotion,
                      minimumOrder: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newPromotion.startDate}
                    onChange={(e) =>
                      setNewPromotion({
                        ...newPromotion,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newPromotion.endDate}
                    onChange={(e) =>
                      setNewPromotion({
                        ...newPromotion,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxUsage">Maximum Usage (optional)</Label>
                <Input
                  id="maxUsage"
                  type="number"
                  value={newPromotion.maxUsage}
                  onChange={(e) =>
                    setNewPromotion({
                      ...newPromotion,
                      maxUsage: e.target.value,
                    })
                  }
                  placeholder="Unlimited"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreatePromotion} className="flex-1">
                  Create Promotion
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Promotions</p>
                <p className="text-2xl font-bold">{promotions.length}</p>
              </div>
              <Tag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Promotions</p>
                <p className="text-2xl font-bold text-green-600">
                  {activePromotions}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold">{totalUsage}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Usage per Promo</p>
                <p className="text-2xl font-bold">
                  {promotions.length > 0
                    ? Math.round(totalUsage / promotions.length)
                    : 0}
                </p>
              </div>
              <Percent className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotions List */}
      <div className="grid gap-4">
        {promotions.map((promotion) => (
          <Card
            key={promotion.id}
            className={!promotion.isActive ? "opacity-60" : ""}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getPromotionTypeIcon(promotion.type)}
                    <h3 className="text-lg font-semibold">{promotion.title}</h3>
                    <Badge
                      variant={promotion.isActive ? "default" : "secondary"}
                    >
                      {promotion.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <p className="text-gray-600 mb-3">{promotion.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <p className="text-gray-600">
                        {getPromotionTypeLabel(promotion.type)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Value:</span>
                      <p className="text-gray-600">
                        {promotion.type === "percentage"
                          ? `${promotion.discountValue}%`
                          : promotion.type === "fixed"
                            ? `₹${promotion.discountValue}`
                            : `${promotion.discountValue}% off`}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Min. Order:</span>
                      <p className="text-gray-600">₹{promotion.minimumOrder}</p>
                    </div>
                    <div>
                      <span className="font-medium">Usage:</span>
                      <p className="text-gray-600">
                        {promotion.usageCount}
                        {promotion.maxUsage ? `/${promotion.maxUsage}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-500">
                    <span>
                      Valid from{" "}
                      {new Date(promotion.startDate).toLocaleDateString()} to{" "}
                      {new Date(promotion.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePromotionStatus(promotion.id)}
                  >
                    {promotion.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePromotion(promotion.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {promotions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No promotions yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first promotional campaign to attract more customers
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Promotion
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
