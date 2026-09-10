import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Pesapal token endpoint iko tayari. Tumia POST kupata token.',
  });
}

export async function POST() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  const authUrl = 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken';

  if (!consumerKey || !consumerSecret) {
    return NextResponse.json(
      { error: 'PESAPAL credentials hazijawekwa kwenye environment variables' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Imeshindikana kupata token' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { token: data.token, expiryDate: data.expiryDate },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Hitilafu ya mtandao kwenye server' },
      { status: 500 }
    );
  }
}