"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  ticketNumber: string;
  createdAt: string;
  lastUpdated: string;
  updatedAt: string;
}

const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I track my order?",
    answer:
      "You can track your order by visiting the Orders section in your account or using the tracking link sent to your email/SMS. Real-time updates are available once the order is assigned to a rider.",
    category: "Orders",
  },
  {
    id: "2",
    question: "What payment methods do you accept?",
    answer:
      "We accept Cash on Delivery, UPI payments, credit/debit cards, and digital wallets like Paytm, PhonePe, and Google Pay.",
    category: "Payment",
  },
  {
    id: "3",
    question: "How do I return or exchange an item?",
    answer:
      "Items can be returned within 7 days of delivery if they are damaged or not as described. Contact our support team to initiate a return request.",
    category: "Returns",
  },
  {
    id: "4",
    question: "How long does delivery take?",
    answer:
      "Delivery typically takes 30-60 minutes within the city limits. Express delivery is available for urgent orders.",
    category: "Delivery",
  },
  {
    id: "5",
    question: "Can I cancel my order?",
    answer:
      "Orders can be cancelled within 5 minutes of placement. After that, please contact the store directly or our support team.",
    category: "Orders",
  },
  {
    id: "6",
    question: "What if my order is delayed?",
    answer:
      "If your order is delayed beyond the estimated time, you'll receive compensation credits. Contact support for immediate assistance.",
    category: "Delivery",
  },
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"contact" | "faq" | "tickets">(
    "contact"
  );
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    subject: "",
    message: "",
    orderId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch tickets when tickets tab is active
  useEffect(() => {
    if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [activeTab]);

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      setTicketsError(null);

      const response = await fetch("/api/support/tickets");
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data = await response.json();
      if (data.success) {
        setTickets(data.data.tickets);
      } else {
        setTicketsError(data.message || "Failed to load tickets");
      }
    } catch (error: any) {
      setTicketsError(error.message || "Failed to load tickets");
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: contactForm.subject,
          description: contactForm.message,
          category: contactForm.category.toUpperCase(),
          priority: "MEDIUM", // Default priority
          orderId: contactForm.orderId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create support ticket");
      }

      const data = await response.json();

      if (data.success) {
        alert(
          `Your support ticket has been created successfully! Ticket #${data.data.ticketNumber}. We'll get back to you within 24 hours.`
        );
        setContactForm({
          name: "",
          email: "",
          phone: "",
          category: "",
          subject: "",
          message: "",
          orderId: "",
        });
        // Refresh tickets if on tickets tab
        if (activeTab === "tickets") {
          fetchTickets();
        }
      } else {
        alert(data.message || "Failed to create support ticket");
      }
    } catch (error: any) {
      alert("Failed to create support ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
              <MessageCircle className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Get instant support, browse FAQs, or contact our team for
            personalized assistance
          </p>
        </div>
      </section>

      {/* Quick Contact Options */}
      <section className="py-8 px-4 bg-white border-b">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Call Us</h3>
                <p className="text-gray-600 mb-3">
                  Speak directly with our support team
                </p>
                <Button variant="outline" className="w-full">
                  +91 1800-XXX-XXXX
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-3">
                  Get instant help from our chat support
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Email Support</h3>
                <p className="text-gray-600 mb-3">Send us a detailed message</p>
                <Button variant="outline" className="w-full">
                  support@townkart.com
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border">
              <button
                onClick={() => setActiveTab("contact")}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  activeTab === "contact"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Contact Us
              </button>
              <button
                onClick={() => setActiveTab("faq")}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  activeTab === "faq"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                FAQ
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  activeTab === "tickets"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Tickets
              </button>
            </div>
          </div>

          {/* Contact Form */}
          {activeTab === "contact" && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Full Name
                        </label>
                        <Input
                          value={contactForm.name}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Phone Number
                        </label>
                        <Input
                          value={contactForm.phone}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+91 XXXXX XXXXX"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            email: e.target.value,
                          })
                        }
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Category
                        </label>
                        <Select
                          value={contactForm.category}
                          onValueChange={(value) =>
                            setContactForm({ ...contactForm, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="orders">
                              Orders & Delivery
                            </SelectItem>
                            <SelectItem value="payment">
                              Payment Issues
                            </SelectItem>
                            <SelectItem value="returns">
                              Returns & Refunds
                            </SelectItem>
                            <SelectItem value="account">
                              Account & Profile
                            </SelectItem>
                            <SelectItem value="technical">
                              Technical Support
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Order ID (Optional)
                        </label>
                        <Input
                          value={contactForm.orderId}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              orderId: e.target.value,
                            })
                          }
                          placeholder="ORD-XXXXXXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Subject
                      </label>
                      <Input
                        value={contactForm.subject}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            subject: e.target.value,
                          })
                        }
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Message
                      </label>
                      <Textarea
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            message: e.target.value,
                          })
                        }
                        placeholder="Please provide detailed information about your query..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* FAQ Section */}
          {activeTab === "faq" && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Frequently Asked Questions
                </h2>
                <p className="text-gray-600">
                  Find quick answers to common questions
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq) => (
                  <Card key={faq.id} className="overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                      }
                      className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {faq.question}
                            </h3>
                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                              {faq.category}
                            </span>
                          </div>
                        </div>
                        {expandedFAQ === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {expandedFAQ === faq.id && (
                      <div className="px-6 pb-6 border-t bg-gray-50">
                        <p className="text-gray-700 pt-4">{faq.answer}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Support Tickets */}
          {activeTab === "tickets" && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    My Support Tickets
                  </h2>
                  <p className="text-gray-600">
                    Track and manage your support requests
                  </p>
                </div>
                <Button onClick={() => setActiveTab("contact")}>
                  <Send className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </div>

              <div className="space-y-4">
                {ticketsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      Loading your support tickets...
                    </p>
                  </div>
                ) : ticketsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Error loading tickets
                    </h3>
                    <p className="text-gray-600 mb-4">{ticketsError}</p>
                    <Button onClick={fetchTickets} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <>
                    {tickets.map((ticket) => (
                      <Card key={ticket.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">
                                {ticket.subject}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Ticket #{ticket.ticketNumber}</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(
                                    ticket.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
                              >
                                {ticket.status.replace("_", " ").toUpperCase()}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                              >
                                {ticket.priority.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                              Last updated:{" "}
                              {new Date(ticket.updatedAt).toLocaleDateString()}
                            </p>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {tickets.length === 0 && (
                      <div className="text-center py-12">
                        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          No support tickets
                        </h3>
                        <p className="text-gray-600 mb-4">
                          You haven't created any support tickets yet.
                        </p>
                        <Button onClick={() => setActiveTab("contact")}>
                          Create Your First Ticket
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
