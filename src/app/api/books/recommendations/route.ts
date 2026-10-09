import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getPersonalizedRecommendations } from '@/lib/recommendation';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('tosach_session_id')?.value || undefined;

    const books = await getPersonalizedRecommendations(user?.id || null, sessionId, 6);

    return NextResponse.json({
      recommendations: books,
      algorithm: {
        name: 'Hybrid Weighted Recommendation Engine',
        weights: {
          collaborativeFiltering: '35%',
          contentBased: '25%',
          behavioralEvents: '15%',
          ratingSignal: '20%',
          trendingBoost: '5%',
        },
        proposalReference: 'Section 3.1 - Recommendation Engine (Page 8)',
      },
    });
  } catch (error: any) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json({ recommendations: [] }, { status: 500 });
  }
}
