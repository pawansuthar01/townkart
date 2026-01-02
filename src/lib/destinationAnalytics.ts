import { prisma } from "@/lib/prisma";

export enum DestinationType {
  HOME = "HOME",
  WORK = "WORK",
  OTHER = "OTHER",
}

export interface DestinationPrediction {
  predictedType: DestinationType;
  confidence: number;
  factors: string[];
}

export interface AddressData {
  id: string;
  latitude?: number;
  longitude?: number;
  line1: string;
  city: string;
  state: string;
}

/**
 * Predict destination type based on historical order data and address characteristics
 */
export async function predictDestinationType(
  address: AddressData,
  userId: string
): Promise<DestinationPrediction> {
  // Validate inputs
  if (!address || !address.line1 || !address.city || !address.state) {
    throw new Error("Invalid address data provided");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    // Get historical orders for this user to this address
    const historicalOrders = await prisma.order.findMany({
      where: {
        customerId: userId,
        deliveryAddress: {
          path: ["line1"],
          equals: address.line1,
        },
      },
      select: {
        createdAt: true,
        deliveryAddress: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Analyze last 50 orders
    });

    const factors: string[] = [];
    let homeScore = 0;
    let workScore = 0;
    let otherScore = 0;

    // Factor 1: Time patterns
    if (historicalOrders.length > 0) {
      const orderHours = historicalOrders.map((order) => {
        const date = new Date(order.createdAt);
        return date.getHours();
      });

      const eveningOrders = orderHours.filter(
        (hour) => hour >= 18 && hour <= 22
      ).length;
      const morningOrders = orderHours.filter(
        (hour) => hour >= 6 && hour <= 10
      ).length;
      const lunchOrders = orderHours.filter(
        (hour) => hour >= 11 && hour <= 14
      ).length;

      if (eveningOrders > morningOrders && eveningOrders > lunchOrders) {
        homeScore += 2;
        factors.push("Evening delivery pattern suggests home address");
      } else if (lunchOrders > eveningOrders && lunchOrders > morningOrders) {
        workScore += 2;
        factors.push("Lunch time delivery pattern suggests work address");
      }

      // Factor 2: Weekend vs weekday patterns
      const weekendOrders = historicalOrders.filter((order) => {
        const day = new Date(order.createdAt).getDay();
        return day === 0 || day === 6; // Sunday = 0, Saturday = 6
      }).length;

      const weekdayOrders = historicalOrders.length - weekendOrders;

      if (weekendOrders > weekdayOrders * 0.8) {
        homeScore += 1;
        factors.push("High weekend activity suggests home address");
      } else if (weekdayOrders > weekendOrders * 2) {
        workScore += 1;
        factors.push("High weekday activity suggests work address");
      }
    }

    // Factor 3: Address text analysis
    const addressText =
      `${address.line1} ${address.city} ${address.state}`.toLowerCase();

    const homeKeywords = [
      "apartment",
      "flat",
      "house",
      "home",
      "residence",
      "villa",
      "cottage",
    ];
    const workKeywords = [
      "office",
      "company",
      "business",
      "corporate",
      "building",
      "tower",
      "complex",
    ];

    const homeMatches = homeKeywords.filter((keyword) =>
      addressText.includes(keyword)
    ).length;
    const workMatches = workKeywords.filter((keyword) =>
      addressText.includes(keyword)
    ).length;

    if (homeMatches > workMatches) {
      homeScore += 1;
      factors.push("Address contains residential keywords");
    } else if (workMatches > homeMatches) {
      workScore += 1;
      factors.push("Address contains business keywords");
    }

    // Factor 4: Frequency
    if (historicalOrders.length >= 10) {
      homeScore += 1;
      factors.push("High frequency of deliveries suggests home address");
    }

    // Determine prediction
    const maxScore = Math.max(homeScore, workScore, otherScore);
    const totalScore = homeScore + workScore + otherScore;

    let predictedType: DestinationType;
    let confidence: number;

    if (maxScore === homeScore) {
      predictedType = DestinationType.HOME;
      confidence = totalScore > 0 ? (homeScore / totalScore) * 100 : 60;
    } else if (maxScore === workScore) {
      predictedType = DestinationType.WORK;
      confidence = totalScore > 0 ? (workScore / totalScore) * 100 : 60;
    } else {
      predictedType = DestinationType.OTHER;
      confidence = 50; // Default confidence for other
    }

    // Boost confidence for addresses with clear patterns
    if (historicalOrders.length >= 5) {
      confidence = Math.min(confidence + 20, 95);
    }

    return {
      predictedType,
      confidence: Math.round(confidence),
      factors,
    };
  } catch (error) {
    console.error("Error predicting destination type:", error);
    // Return default prediction on error
    return {
      predictedType: DestinationType.OTHER,
      confidence: 50,
      factors: ["Unable to analyze historical data"],
    };
  }
}

/**
 * Get destination analytics for a user
 */
export async function getDestinationAnalytics(userId: string) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
    });

    // Get order counts for each address
    const addressOrderCounts = await Promise.all(
      addresses.map(async (address) => {
        const orderCount = await prisma.order.count({
          where: {
            customerId: userId,
            deliveryAddress: {
              path: ["line1"],
              equals: address.line1,
            },
          },
        });
        return {
          addressId: address.id,
          orderCount,
        };
      })
    );

    const orderCountMap = new Map(
      addressOrderCounts.map((item) => [item.addressId, item.orderCount])
    );

    const analytics = await Promise.all(
      addresses.map(async (address) => {
        const prediction = await predictDestinationType(
          {
            id: address.id,
            latitude: address.latitude || undefined,
            longitude: address.longitude || undefined,
            line1: address.line1,
            city: address.city,
            state: address.state,
          },
          userId
        );

        return {
          addressId: address.id,
          address: `${address.line1}, ${address.city}, ${address.state}`,
          type: address.addressType,
          predictedType: prediction.predictedType,
          confidence: prediction.confidence,
          orderCount: orderCountMap.get(address.id) || 0,
          factors: prediction.factors,
        };
      })
    );

    return {
      totalAddresses: addresses.length,
      analytics,
      summary: {
        home: analytics.filter((a) => a.predictedType === DestinationType.HOME)
          .length,
        work: analytics.filter((a) => a.predictedType === DestinationType.WORK)
          .length,
        other: analytics.filter(
          (a) => a.predictedType === DestinationType.OTHER
        ).length,
      },
    };
  } catch (error) {
    console.error("Error getting destination analytics:", error);
    throw new Error("Failed to get destination analytics");
  }
}
