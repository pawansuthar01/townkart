import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Users,
  Truck,
  Shield,
  Award,
  Heart,
  Target,
  Zap,
  Globe,
  Star,
} from "lucide-react";

export default function AboutPage() {
  const stats = [
    { number: "10,000+", label: "Happy Customers", icon: Users },
    { number: "500+", label: "Partner Shops", icon: ShoppingCart },
    { number: "50,000+", label: "Orders Delivered", icon: Truck },
    { number: "4.8", label: "Average Rating", icon: Star },
  ];

  const values = [
    {
      icon: Shield,
      title: "Trust & Security",
      description:
        "We prioritize your safety with secure payments, verified merchants, and quality assurance.",
    },
    {
      icon: Heart,
      title: "Customer First",
      description:
        "Every decision we make puts our customers' needs and satisfaction at the forefront.",
    },
    {
      icon: Target,
      title: "Innovation",
      description:
        "We continuously evolve our platform with cutting-edge technology and user-friendly features.",
    },
    {
      icon: Globe,
      title: "Community Impact",
      description:
        "Supporting local businesses and creating opportunities for delivery partners in every community.",
    },
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Mike Chen",
      role: "CTO",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Priya Sharma",
      role: "Head of Operations",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "David Rodriguez",
      role: "Head of Partnerships",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-townkart-primary to-townkart-secondary text-white py-20">
        <div className="w-full px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About TownKart
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              Revolutionizing local commerce by connecting customers with nearby
              merchants through innovative technology and seamless delivery
              experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="bg-white text-townkart-primary hover:bg-gray-100"
                >
                  Join Our Community
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-townkart-primary"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-townkart-primary/10 rounded-full">
                    <stat.icon className="h-8 w-8 text-townkart-primary" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-lg text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-6 bg-white">
        <div className="w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  TownKart was born from a simple idea: local shopping should be
                  as convenient as online shopping. We noticed that while
                  e-commerce giants dominated the digital space, local merchants
                  struggled to reach customers who preferred the personal touch
                  of neighborhood shopping.
                </p>
                <p>
                  Founded in 2023, we've grown from a small team with a big
                  vision to a comprehensive platform serving thousands of
                  customers and hundreds of local businesses across multiple
                  cities.
                </p>
                <p>
                  Today, TownKart bridges the gap between traditional retail and
                  modern convenience, empowering local economies while providing
                  customers with unparalleled shopping experiences.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-townkart-primary/20 to-townkart-secondary/20 rounded-2xl p-8">
                <div className="w-full h-full bg-white rounded-xl shadow-lg flex items-center justify-center">
                  <ShoppingCart className="h-24 w-24 text-townkart-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-6">
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-8">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-townkart-primary/10 rounded-full">
                      <value.icon className="h-8 w-8 text-townkart-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6 bg-townkart-primary text-white">
        <div className="w-full text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              To empower local businesses and enhance community commerce by
              providing innovative technology solutions that make local shopping
              more accessible, convenient, and enjoyable for everyone.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-white/80" />
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-white/80">
                  Lightning-fast delivery within 30-60 minutes
                </p>
              </div>
              <div className="text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-white/80" />
                <h3 className="text-xl font-semibold mb-2">
                  Quality Assurance
                </h3>
                <p className="text-white/80">
                  Rigorous quality checks for every order
                </p>
              </div>
              <div className="text-center">
                <Globe className="h-12 w-12 mx-auto mb-4 text-white/80" />
                <h3 className="text-xl font-semibold mb-2">Local Impact</h3>
                <p className="text-white/80">
                  Supporting local economies and communities
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-6">
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The passionate individuals driving TownKart's vision forward
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gray-900 text-white">
        <div className="w-full text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Whether you're a customer looking for great local products or a
            merchant wanting to grow your business, TownKart is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="townkart-gradient hover:opacity-90">
                Get Started Today
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
