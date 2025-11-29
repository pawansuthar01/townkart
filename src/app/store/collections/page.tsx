"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Layers, Plus, Edit, Trash2, Eye, Package } from "lucide-react";

interface StoreCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  products: any[];
  type: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export default function StoreCollectionsPage() {
  const [collections, setCollections] = useState<StoreCollection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<StoreCollection | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    products: [] as string[],
    type: "MANUAL",
    isActive: true,
    isFeatured: false,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCollections();
    fetchProducts();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/store/collections");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCollections(data.collections);
        }
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/store/products");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCollection
        ? `/api/store/collections/${editingCollection.id}`
        : "/api/store/collections";

      const method = editingCollection ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCollections();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving collection:", error);
    }
  };

  const handleEdit = (collection: StoreCollection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || "",
      products: collection.products || [],
      type: collection.type,
      isActive: collection.isActive,
      isFeatured: collection.isFeatured,
      sortOrder: collection.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (collectionId: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      const response = await fetch(`/api/store/collections/${collectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCollections();
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      products: [],
      type: "MANUAL",
      isActive: true,
      isFeatured: false,
      sortOrder: 0,
    });
    setEditingCollection(null);
  };

  const toggleProductSelection = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.includes(productId)
        ? prev.products.filter((id) => id !== productId)
        : [...prev.products, productId],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Store Collections
          </h1>
          <p className="text-gray-600">
            Organize your products into collections
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCollection ? "Edit Collection" : "Create Collection"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Collection Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="DYNAMIC">Dynamic</SelectItem>
                      <SelectItem value="FEATURED_PRODUCTS">
                        Featured Products
                      </SelectItem>
                      <SelectItem value="BEST_SELLERS">Best Sellers</SelectItem>
                      <SelectItem value="NEW_ARRIVALS">New Arrivals</SelectItem>
                      <SelectItem value="ON_SALE">On Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label>Products ({formData.products.length} selected)</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`product-${product.id}`}
                        checked={formData.products.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="rounded"
                      />
                      <label
                        htmlFor={`product-${product.id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span>{product.name}</span>
                          <span className="text-gray-500">
                            ₹{product.price}
                          </span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isFeatured: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="isFeatured">Featured</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCollection ? "Update" : "Create"} Collection
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Collections
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collections.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Collections
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collections.filter((c) => c.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Featured Collections
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collections.filter((c) => c.isFeatured).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products in Collections
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collections.reduce(
                (total, collection) =>
                  total + (collection.products?.length || 0),
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Collections ({collections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{collection.name}</div>
                      <div className="text-sm text-gray-500">
                        {collection.slug}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {collection.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {collection.products?.length || 0} products
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge
                        variant={collection.isActive ? "default" : "secondary"}
                      >
                        {collection.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {collection.isFeatured && (
                        <Badge variant="outline">Featured</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{collection.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(collection)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(collection.id)}
                        className="text-red-600 hover:text-red-700"
                      >
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
