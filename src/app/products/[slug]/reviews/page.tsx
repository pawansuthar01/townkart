"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Flag,
  MoreVertical,
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
  isVerified: boolean;
  createdAt: string;
  helpfulVotes: number;
  customer: {
    id: string;
    fullName: string;
    profileImageUrl?: string;
  };
  order?: {
    id: string;
    orderNumber: string;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ReviewsPageProps {
  params: {
    slug: string;
  };
}

export default function ProductReviewsPage({ params }: ReviewsPageProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: "",
    comment: "",
    pros: "",
    cons: "",
  });
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, currentPage, sortBy, ratingFilter]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/products/slug/${params.slug}`);
      const data = await response.json();
      if (data.success) {
        setProductId(data.data.id);
      } else {
        setError("Product not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sortBy,
        ...(ratingFilter && { rating: ratingFilter }),
      });

      const response = await fetch(
        `/api/products/${params.slug}/reviews?${queryParams}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      if (data.success) {
        setReviews(data.data.reviews);
        setStats(data.data.stats);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId) return;

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newReview,
          pros: newReview.pros
            ? newReview.pros.split(",").map((p) => p.trim())
            : undefined,
          cons: newReview.cons
            ? newReview.cons.split(",").map((c) => c.trim())
            : undefined,
        }),
      });

      if (response.ok) {
        setShowReviewForm(false);
        setNewReview({
          rating: 5,
          title: "",
          comment: "",
          pros: "",
          cons: "",
        });
        fetchReviews(); // Refresh reviews
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to submit review");
      }
    } catch (error) {
      alert("Failed to submit review");
    }
  };

  const handleVoteReview = async (reviewId: string, isHelpful: boolean) => {
    try {
      const response = await fetch(
        `/api/products/${productId}/reviews/${reviewId}/vote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isHelpful }),
        }
      );

      if (response.ok) {
        setUserVotes((prev) => ({ ...prev, [reviewId]: isHelpful }));
        fetchReviews(); // Refresh to get updated vote counts
      } else {
        alert("Failed to vote on review");
      }
    } catch (error) {
      alert("Failed to vote on review");
    }
  };

  const handleReportReview = async (reviewId: string, reason: string) => {
    try {
      const response = await fetch(
        `/api/products/${params.slug}/reviews/${reviewId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        alert("Review reported successfully. Thank you for your feedback.");
      } else {
        alert("Failed to report review");
      }
    } catch (error) {
      alert("Failed to report review");
    }
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onRatingChange?: (rating: number) => void
  ) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={
              interactive && onRatingChange
                ? () => onRatingChange(star)
                : undefined
            }
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating: number) => {
    if (!stats) return 0;
    return stats.totalReviews > 0
      ? (stats.ratingDistribution[
          rating as keyof typeof stats.ratingDistribution
        ] /
          stats.totalReviews) *
          100
      : 0;
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/products/${params.slug}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Product
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Customer Reviews
          </h1>
          <p className="text-gray-600">
            See what customers are saying about this product
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Review Stats */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Review Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <>
                    {/* Average Rating */}
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {stats.averageRating.toFixed(1)}
                      </div>
                      <div className="flex justify-center mb-2">
                        {renderStars(Math.round(stats.averageRating))}
                      </div>
                      <p className="text-sm text-gray-600">
                        Based on {stats.totalReviews} reviews
                      </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-3">{rating}</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{
                                width: `${getRatingPercentage(rating)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">
                            {
                              stats.ratingDistribution[
                                rating as keyof typeof stats.ratingDistribution
                              ]
                            }
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Write Review Button */}
                    <div className="mt-6">
                      <Button
                        className="w-full"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Write a Review
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Sort by:</span>
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="highest">Highest Rated</SelectItem>
                      <SelectItem value="lowest">Lowest Rated</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Ratings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Review Form */}
            {showReviewForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Write Your Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-6 w-6 cursor-pointer ${
                              star <= newReview.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                            onClick={() =>
                              setNewReview({ ...newReview, rating: star })
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Review Title
                      </label>
                      <input
                        type="text"
                        value={newReview.title}
                        onChange={(e) =>
                          setNewReview({ ...newReview, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Summarize your experience"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Your Review
                      </label>
                      <Textarea
                        value={newReview.comment}
                        onChange={(e) =>
                          setNewReview({
                            ...newReview,
                            comment: e.target.value,
                          })
                        }
                        placeholder="Tell others about your experience with this product"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Pros (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={newReview.pros}
                          onChange={(e) =>
                            setNewReview({ ...newReview, pros: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Great quality, fast delivery"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Cons (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={newReview.cons}
                          onChange={(e) =>
                            setNewReview({ ...newReview, cons: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Price could be better"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit">Submit Review</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReviewForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {review.customer.profileImageUrl ? (
                          <img
                            src={review.customer.profileImageUrl}
                            alt={review.customer.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-gray-400" />
                        )}
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {review.customer.fullName}
                          </h4>
                          {review.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-600">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {review.title && (
                          <h5 className="font-medium text-gray-900 mb-2">
                            {review.title}
                          </h5>
                        )}

                        {review.comment && (
                          <p className="text-gray-700 mb-3">{review.comment}</p>
                        )}

                        {/* Pros and Cons */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {review.pros && review.pros.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <ThumbsUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-600">
                                  Pros
                                </span>
                              </div>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {review.pros.map((pro, index) => (
                                  <li key={index}>• {pro}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {review.cons && review.cons.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <ThumbsDown className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-600">
                                  Cons
                                </span>
                              </div>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {review.cons.map((con, index) => (
                                  <li key={index}>• {con}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Review Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {review.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Review image ${index + 1}`}
                                className="w-16 h-16 object-cover rounded border"
                              />
                            ))}
                          </div>
                        )}

                        {/* Review Actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleVoteReview(review.id, true)
                                }
                                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                                  userVotes[review.id] === true
                                    ? "bg-green-100 text-green-700"
                                    : "hover:bg-gray-100 text-gray-600"
                                }`}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                Helpful ({review.helpfulVotes || 0})
                              </button>
                            </div>
                          </div>

                          <div className="relative">
                            <button
                              onClick={() => {
                                const reason = prompt(
                                  "Please provide a reason for reporting this review:"
                                );
                                if (reason) {
                                  handleReportReview(review.id, reason);
                                }
                              }}
                              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <Flag className="h-4 w-4" />
                              Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Empty State */}
            {reviews.length === 0 && !loading && (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No reviews yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to review this product and help others make
                  informed decisions.
                </p>
                <Button onClick={() => setShowReviewForm(true)}>
                  Write the First Review
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
