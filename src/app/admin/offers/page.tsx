"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Store,
  Package,
  Eye,
  RefreshCw,
} from "lucide-react";

interface Offer {
  id: string;
  title: string;
  description: string;
  type: string;
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  applicableTo: string;
  productIds?: string[];
  categoryIds?: string[];
  merchantIds?: string[];
  targetUsers: string;
  userIds?: string[];
  userSegments?: string[];
  usageLimit?: number;
  perUserLimit: number;
  usedCount: number;
  couponCode?: string;
  isAutoApply: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string;
  priority: number;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  store?: {
    id: string;
    name: string;
  };
}

interface Store {
  id: string;
  name: string;
  city: string;
  category: string;
}

interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [newOffer, setNewOffer] = useState({
    title: "",
    description: "",
    type: "PERCENTAGE_DISCOUNT",
    discountValue: 0,
    maxDiscount: 0,
    minOrderValue: 0,
    applicableTo: "ALL_PRODUCTS",
    targetUsers: "ALL_USERS",
    usageLimit: 0,
    perUserLimit: 1,
    couponCode: "",
    isAutoApply: false,
    priority: 0,
    terms: "",
  });

  useEffect(() => {
    fetchOffers();
    fetchProducts();
    fetchStores();
    fetchUsers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/admin/offers");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOffers(data.offers);
        }
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?limit=100");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/shops?limit=100");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStores(data.stores);
        }
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users?limit=100");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateOffer = async () => {
    try {
      const offerData = {
        ...newOffer,
        productIds: selectedProducts.length > 0 ? selectedProducts : undefined,
        merchantIds: selectedStores.length > 0 ? selectedStores : undefined,
        userIds: selectedUsers.length > 0 ? selectedUsers : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        usageLimit: newOffer.usageLimit > 0 ? newOffer.usageLimit : undefined,
      };

      const response = await fetch("/api/admin/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(offerData),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchOffers();
      }
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  const resetForm = () => {
    setNewOffer({
      title: "",
      description: "",
      type: "PERCENTAGE_DISCOUNT",
      discountValue: 0,
      maxDiscount: 0,
      minOrderValue: 0,
      applicableTo: "ALL_PRODUCTS",
      targetUsers: "ALL_USERS",
      usageLimit: 0,
      perUserLimit: 1,
      couponCode: "",
      isAutoApply: false,
      priority: 0,
      terms: "",
    });
    setSelectedProducts([]);
    setSelectedStores([]);
    setSelectedUsers([]);
    setStartDate("");
    setEndDate("");
  };

  const getOfferTypeLabel = (type: string) => {
    switch (type) {
      case "PERCENTAGE_DISCOUNT":
        return "Percentage Discount";
      case "FIXED_DISCOUNT":
        return "Fixed Discount";
      case "FREE_SHIPPING":
        return "Free Shipping";
      case "BUY_ONE_GET_ONE":
        return "Buy One Get One";
      case "BUNDLE_DISCOUNT":
        return "Bundle Discount";
      default:
        return type;
    }
  };

  const getApplicabilityLabel = (applicableTo: string) => {
    switch (applicableTo) {
      case "ALL_PRODUCTS":
        return "All Products";
      case "SPECIFIC_PRODUCTS":
        return "Specific Products";
      case "SPECIFIC_CATEGORIES":
        return "Specific Categories";
      case "SPECIFIC_MERCHANTS":
        return "Specific Stores";
      default:
        return applicableTo;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offer Management</h1>
          <p className="text-gray-600">
            Create and manage offers for all stores
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchOffers} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Offer</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Offer Title</Label>
                    <Input
                      id="title"
                      value={newOffer.title}
                      onChange={(e) =>
                        setNewOffer({ ...newOffer, title: e.target.value })
                      }
                      placeholder="Enter offer title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newOffer.description}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter offer description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Offer Type</Label>
                    <Select
                      value={newOffer.type}
                      onValueChange={(value) =>
                        setNewOffer({ ...newOffer, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE_DISCOUNT">
                          Percentage Discount
                        </SelectItem>
                        <SelectItem value="FIXED_DISCOUNT">
                          Fixed Discount
                        </SelectItem>
                        <SelectItem value="FREE_SHIPPING">
                          Free Shipping
                        </SelectItem>
                        <SelectItem value="BUY_ONE_GET_ONE">
                          Buy One Get One
                        </SelectItem>
                        <SelectItem value="BUNDLE_DISCOUNT">
                          Bundle Discount
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="discountValue">Discount Value</Label>
                    <Input
                      id="discountValue"
                      type="number"
                      value={newOffer.discountValue}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          discountValue: parseFloat(e.target.value),
                        })
                      }
                      placeholder={
                        newOffer.type === "PERCENTAGE_DISCOUNT"
                          ? "Enter percentage (e.g., 20)"
                          : "Enter amount (e.g., 100)"
                      }
                    />
                  </div>

                  {newOffer.type === "PERCENTAGE_DISCOUNT" && (
                    <div>
                      <Label htmlFor="maxDiscount">Max Discount Amount</Label>
                      <Input
                        id="maxDiscount"
                        type="number"
                        value={newOffer.maxDiscount}
                        onChange={(e) =>
                          setNewOffer({
                            ...newOffer,
                            maxDiscount: parseFloat(e.target.value),
                          })
                        }
                        placeholder="Maximum discount amount"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="minOrderValue">Minimum Order Value</Label>
                    <Input
                      id="minOrderValue"
                      type="number"
                      value={newOffer.minOrderValue}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          minOrderValue: parseFloat(e.target.value),
                        })
                      }
                      placeholder="Minimum order value to apply offer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="applicableTo">Applicable To</Label>
                    <Select
                      value={newOffer.applicableTo}
                      onValueChange={(value) =>
                        setNewOffer({ ...newOffer, applicableTo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_PRODUCTS">
                          All Products
                        </SelectItem>
                        <SelectItem value="SPECIFIC_PRODUCTS">
                          Specific Products
                        </SelectItem>
                        <SelectItem value="SPECIFIC_CATEGORIES">
                          Specific Categories
                        </SelectItem>
                        <SelectItem value="SPECIFIC_MERCHANTS">
                          Specific Stores
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="targetUsers">Target Users</Label>
                    <Select
                      value={newOffer.targetUsers}
                      onValueChange={(value) =>
                        setNewOffer({ ...newOffer, targetUsers: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_USERS">All Users</SelectItem>
                        <SelectItem value="SPECIFIC_USERS">
                          Specific Users
                        </SelectItem>
                        <SelectItem value="NEW_USERS">New Users</SelectItem>
                        <SelectItem value="RETURNING_USERS">
                          Returning Users
                        </SelectItem>
                        <SelectItem value="LOYAL_CUSTOMERS">
                          Loyal Customers
                        </SelectItem>
                        <SelectItem value="FIRST_TIME_USERS">
                          First Time Users
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      value={newOffer.usageLimit}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          usageLimit: parseInt(e.target.value),
                        })
                      }
                      placeholder="Total usage limit"
                    />
                  </div>

                  <div>
                    <Label htmlFor="perUserLimit">Per User Limit</Label>
                    <Input
                      id="perUserLimit"
                      type="number"
                      value={newOffer.perUserLimit}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          perUserLimit: parseInt(e.target.value),
                        })
                      }
                      placeholder="Usage limit per user"
                    />
                  </div>

                  <div>
                    <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                    <Input
                      id="couponCode"
                      value={newOffer.couponCode}
                      onChange={(e) =>
                        setNewOffer({ ...newOffer, couponCode: e.target.value })
                      }
                      placeholder="Enter coupon code"
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={newOffer.priority}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          priority: parseInt(e.target.value),
                        })
                      }
                      placeholder="Offer priority (higher = more priority)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      value={newOffer.terms}
                      onChange={(e) =>
                        setNewOffer({ ...newOffer, terms: e.target.value })
                      }
                      placeholder="Enter terms and conditions"
                    />
                  </div>
                </div>

                {/* Product Selection */}
                {newOffer.applicableTo === "SPECIFIC_PRODUCTS" && (
                  <div className="col-span-2">
                    <Label>Select Products</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProducts([
                                  ...selectedProducts,
                                  product.id,
                                ]);
                              } else {
                                setSelectedProducts(
                                  selectedProducts.filter(
                                    (id) => id !== product.id,
                                  ),
                                );
                              }
                            }}
                          />
                          <Label htmlFor={`product-${product.id}`}>
                            {product.name} - ₹{product.price}
                            {product.store && ` (${product.store.name})`}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Store Selection */}
                {newOffer.applicableTo === "SPECIFIC_MERCHANTS" && (
                  <div className="col-span-2">
                    <Label>Select Stores</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                      {stores.map((store) => (
                        <div
                          key={store.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`store-${store.id}`}
                            checked={selectedStores.includes(store.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStores([
                                  ...selectedStores,
                                  store.id,
                                ]);
                              } else {
                                setSelectedStores(
                                  selectedStores.filter(
                                    (id) => id !== store.id,
                                  ),
                                );
                              }
                            }}
                          />
                          <Label htmlFor={`store-${store.id}`}>
                            {store.name} - {store.city} ({store.category})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Selection */}
                {newOffer.targetUsers === "SPECIFIC_USERS" && (
                  <div className="col-span-2">
                    <Label>Select Users</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(
                                  selectedUsers.filter((id) => id !== user.id),
                                );
                              }
                            }}
                          />
                          <Label htmlFor={`user-${user.id}`}>
                            {user.fullName} - {user.phoneNumber}
                            {user.email && ` (${user.email})`}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateOffer}>Create Offer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Offers ({offers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Applicability</TableHead>
                <TableHead>Target Users</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Till</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{offer.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getOfferTypeLabel(offer.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getApplicabilityLabel(offer.applicableTo)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {offer.targetUsers.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {offer.usedCount}
                    {offer.usageLimit && `/${offer.usageLimit}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={offer.isActive ? "default" : "secondary"}>
                      {offer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(offer.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
