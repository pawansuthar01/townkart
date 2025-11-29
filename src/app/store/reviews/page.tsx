"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Reply } from "lucide-react";

interface Review {
  id: string;
  orderId: string;
  customerName: string;
  customerId: string;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
  response?: string;
  responseAt?: string;
  isPublic: boolean;
}

export default function StoreReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState("");
  const [filterRating, setFilterRating] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // TODO: connect to DB/API
      setReviews([]);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;

    setIsResponding(true);
    try {
      // In a real app, this would call an API
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                response: responseText,
                responseAt: new Date().toISOString(),
              }
            : review,
        ),
      );
      setSelectedReview(null);
      setResponseText("");
    } catch (error) {
      console.error("Error responding to review:", error);
    } finally {
      setIsResponding(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filterRating === "ALL") return true;
    return review.rating.toString() === filterRating;
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === rating).length / reviews.length) *
          100
        : 0,
  }));

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
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
          <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-gray-600">
            Manage and respond to customer feedback
          </p>
        </div>
      </div>

      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">
                    {averageRating.toFixed(1)}
                  </span>
                  <div className="flex">
                    {renderStars(Math.round(averageRating))}
                  </div>
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Responded</p>
                <p className="text-2xl font-bold">
                  {reviews.filter((r) => r.response).length}
                </p>
              </div>
              <Reply className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Response</p>
                <p className="text-2xl font-bold text-red-600">
                  {reviews.filter((r) => !r.response).length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12">{count}</span>
                <span className="text-sm text-gray-500 w-12">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <Label>Filter by Rating</Label>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.customerName}
                  </TableCell>
                  <TableCell>{review.productName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                      <span className="ml-1 text-sm">({review.rating})</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm">{review.comment}</p>
                  </TableCell>
                  <TableCell>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {review.response ? (
                      <Badge variant="default">Responded</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReview(review)}
                    >
                      {review.response ? "View Response" : "Respond"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Response Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Review Details</h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="font-medium">{selectedReview.customerName}</p>
                <p className="text-sm text-gray-600">
                  {selectedReview.productName}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {renderStars(selectedReview.rating)}
                  <span className="ml-2 text-sm">
                    {new Date(selectedReview.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">{selectedReview.comment}</p>
              </div>

              {selectedReview.response && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Reply className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      Your Response
                    </span>
                    <span className="text-xs text-gray-500">
                      {selectedReview.responseAt &&
                        new Date(
                          selectedReview.responseAt,
                        ).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800">
                    {selectedReview.response}
                  </p>
                </div>
              )}
            </div>

            {!selectedReview.response && (
              <div className="space-y-4">
                <Label htmlFor="response">Your Response</Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write a response to this review..."
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedReview(null);
                      setResponseText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleRespond(selectedReview.id)}
                    disabled={isResponding || !responseText.trim()}
                  >
                    {isResponding ? "Sending..." : "Send Response"}
                  </Button>
                </div>
              </div>
            )}

            {selectedReview.response && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReview(null)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
