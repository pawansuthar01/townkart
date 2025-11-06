import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Scale,
  Shield,
  AlertTriangle,
  Users,
  CreditCard,
} from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      icon: Users,
      title: "User Accounts",
      content: [
        "You must be at least 18 years old to use our services",
        "You are responsible for maintaining account security",
        "Provide accurate and complete information during registration",
        "One account per user; multiple accounts may be suspended",
        "Account termination rights reserved for policy violations",
        "Account recovery requires valid identification",
      ],
    },
    {
      icon: Scale,
      title: "Service Usage",
      content: [
        "Services available only in designated geographic areas",
        "Orders subject to availability and merchant acceptance",
        "Delivery times are estimates, not guaranteed",
        "Minimum order values may apply for certain merchants",
        "Service fees and delivery charges clearly displayed",
        "Platform usage limited to personal, non-commercial purposes",
      ],
    },
    {
      icon: CreditCard,
      title: "Payments & Refunds",
      content: [
        "All payments processed securely through authorized gateways",
        "Prices include applicable taxes and service charges",
        "Refunds processed within 5-7 business days",
        "Refund eligibility determined by merchant and platform policies",
        "Payment method fees may apply for certain transactions",
        "Disputed charges resolved through customer support",
      ],
    },
    {
      icon: Shield,
      title: "User Conduct",
      content: [
        "Respect all users, merchants, and delivery partners",
        "No fraudulent, abusive, or illegal activities",
        "Accurate order information and delivery instructions",
        "Proper handling of delivered items and packaging",
        "No reverse engineering or unauthorized access attempts",
        "Compliance with all applicable local laws and regulations",
      ],
    },
    {
      icon: AlertTriangle,
      title: "Liability & Disclaimers",
      content: [
        "Service provided 'as is' without warranties",
        "No liability for indirect or consequential damages",
        "Food quality and safety responsibility of merchants",
        "Delivery delays due to unforeseen circumstances",
        "Platform not responsible for third-party actions",
        "User assumes all risks associated with service usage",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-townkart-primary to-townkart-secondary text-white py-16">
        <div className="w-full px-6">
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Please read these terms carefully before using TownKart services.
              By using our platform, you agree to be bound by these terms.
            </p>
            <Badge className="mt-4 bg-white/20 text-white border-white/30">
              Effective: November 2024
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
                Agreement Overview
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  These Terms of Service ("Terms") govern your use of TownKart's
                  platform, mobile application, and related services. By
                  accessing or using our services, you agree to be bound by
                  these Terms and our Privacy Policy.
                </p>
                <p>
                  TownKart provides a marketplace connecting customers with
                  local merchants and delivery partners. We facilitate
                  transactions but are not a party to the underlying sale of
                  goods or services.
                </p>
                <p>
                  If you do not agree to these Terms, please do not use our
                  services. We reserve the right to modify these Terms at any
                  time.
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

      {/* Prohibited Activities */}
      <section className="py-16 px-6">
        <div className="w-full">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">
                Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Account & Security
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Sharing login credentials</li>
                    <li>• Creating fake accounts</li>
                    <li>• Attempting unauthorized access</li>
                    <li>• Circumventing security measures</li>
                    <li>• Using automated tools or bots</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Content & Conduct
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Posting inappropriate content</li>
                    <li>• Harassment or abusive behavior</li>
                    <li>• Fraudulent or deceptive practices</li>
                    <li>• Violating intellectual property rights</li>
                    <li>• Interfering with platform operations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Termination */}
      <section className="py-16 px-6 bg-gray-100">
        <div className="w-full">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Account Termination
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We reserve the right to suspend or terminate your account and
                  access to our services at our discretion, without prior
                  notice, for conduct that violates these Terms or is harmful to
                  other users, merchants, delivery partners, or our platform.
                </p>
                <p>
                  Upon termination, your right to use our services ceases
                  immediately. We may delete your account and associated data,
                  though some information may be retained for legal compliance
                  or legitimate business purposes.
                </p>
                <p>
                  You may also terminate your account at any time by contacting
                  customer support or using the account deletion feature in your
                  profile settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 px-6 bg-townkart-primary text-white">
        <div className="w-full text-center">
          <h2 className="text-3xl font-bold mb-6">Questions About Terms?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            If you have any questions about these Terms of Service or need
            clarification on any provision, please contact our legal team.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Legal Department</h3>
              <p className="text-white/80 text-sm">legal@townkart.com</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Compliance</h3>
              <p className="text-white/80 text-sm">compliance@townkart.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* Updates */}
      <section className="py-16 px-6">
        <div className="w-full">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Terms Updates
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We may update these Terms from time to time to reflect changes
                  in our services, legal requirements, or business practices.
                  When we make material changes, we will notify you through our
                  platform or by email.
                </p>
                <p>
                  Your continued use of our services after any such changes
                  constitutes your acceptance of the updated Terms. We recommend
                  reviewing these Terms periodically to stay informed of any
                  updates.
                </p>
                <p>
                  If you do not agree to the updated Terms, you should stop
                  using our services and contact us to terminate your account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
