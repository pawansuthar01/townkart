import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Users, Database, Cookie } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      icon: Eye,
      title: "Information We Collect",
      content: [
        "Personal information (name, email, phone number) when you register",
        "Delivery addresses and location data for order fulfillment",
        "Payment information processed securely through our payment partners",
        "Order history and shopping preferences to improve your experience",
        "Device information and usage analytics for app optimization",
      ],
    },
    {
      icon: Database,
      title: "How We Use Your Information",
      content: [
        "Process and deliver your orders efficiently",
        "Provide customer support and respond to your inquiries",
        "Send important updates about your orders and account",
        "Improve our services and develop new features",
        "Ensure platform security and prevent fraud",
        "Comply with legal obligations and regulations",
      ],
    },
    {
      icon: Users,
      title: "Information Sharing",
      content: [
        "With delivery partners to complete your orders",
        "With merchants to fulfill your purchases",
        "With payment processors for secure transactions",
        "When required by law or to protect our rights",
        "With your consent for specific purposes",
        "In aggregated form for business analytics",
      ],
    },
    {
      icon: Lock,
      title: "Data Security",
      content: [
        "Industry-standard encryption for all data transmission",
        "Secure storage with regular security audits",
        "Limited access to personal data on a need-to-know basis",
        "Regular security updates and monitoring",
        "Immediate breach notification procedures",
        "Data minimization and retention policies",
      ],
    },
    {
      icon: Cookie,
      title: "Cookies and Tracking",
      content: [
        "Essential cookies for app functionality and security",
        "Analytics cookies to understand user behavior",
        "Preference cookies to remember your settings",
        "Marketing cookies for personalized offers",
        "Third-party cookies from our service providers",
        "Clear options to manage cookie preferences",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-townkart-primary to-townkart-secondary text-white py-16">
        <div className="w-full px-6">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we
              collect, use, and protect your personal information.
            </p>
            <Badge className="mt-4 bg-white/20 text-white border-white/30">
              Last updated: November 2024
            </Badge>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 px-6">
        <div className="w-full">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Our Commitment to Privacy
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  TownKart is committed to protecting your privacy and ensuring
                  the security of your personal information. This Privacy Policy
                  explains how we collect, use, disclose, and safeguard your
                  information when you use our platform.
                </p>
                <p>
                  By using TownKart, you agree to the collection and use of
                  information in accordance with this policy. We will not use or
                  share your information except as described in this Privacy
                  Policy.
                </p>
                <p>
                  This policy applies to all users of our platform, including
                  customers, merchants, and delivery partners.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detailed Sections */}
      <section className="py-16 px-6 bg-white">
        <div className="w-full space-y-8">
          {sections.map((section, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <section.icon className="h-8 w-8 text-townkart-primary mr-3" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.content.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-townkart-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-16 px-6">
        <div className="w-full">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Access & Control
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Access your personal information</li>
                    <li>• Correct inaccurate data</li>
                    <li>• Delete your account and data</li>
                    <li>• Export your data</li>
                    <li>• Withdraw consent</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Communication Preferences
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Opt-out of marketing emails</li>
                    <li>• Control notification settings</li>
                    <li>• Manage cookie preferences</li>
                    <li>• Update communication channels</li>
                    <li>• Unsubscribe from newsletters</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 px-6 bg-gray-900 text-white">
        <div className="w-full text-center">
          <h2 className="text-3xl font-bold mb-6">Questions About Privacy?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            If you have any questions about this Privacy Policy or our data
            practices, please don't hesitate to contact us.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-townkart-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Data Protection</h3>
              <p className="text-gray-300 text-sm">privacy@townkart.com</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-townkart-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Security</h3>
              <p className="text-gray-300 text-sm">security@townkart.com</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-townkart-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">General Support</h3>
              <p className="text-gray-300 text-sm">support@townkart.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Updates */}
      <section className="py-16 px-6">
        <div className="w-full">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Changes to This Policy
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We may update this Privacy Policy from time to time to reflect
                  changes in our practices or for other operational, legal, or
                  regulatory reasons.
                </p>
                <p>
                  When we make material changes to this Privacy Policy, we will
                  notify you through our platform or by other means, such as
                  email. Your continued use of our services after any such
                  changes constitutes your acceptance of the updated Privacy
                  Policy.
                </p>
                <p>
                  We encourage you to review this Privacy Policy periodically to
                  stay informed about how we are protecting your information.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
