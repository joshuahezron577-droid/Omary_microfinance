import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Pesapal submit order endpoint iko tayari. Tumia POST kutuma oda.',
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      amount,
      description,
      email,
      firstName,
      lastName,
      phoneNumber,
      orderId,
    } = body;

    const authResponse = await fetch(
      'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          consumer_key: process.env.PESAPAL_CONSUMER_KEY,
          consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
        }),
      }
    );

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Imeshindikana kupata token ya malipo' },
        { status: 400 }
      );
    }

    const orderResponse = await fetch(
      'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({
          id: orderId || `LOAN-${Date.now()}`,
          currency: 'TZS',
          amount,
          description: description || 'Malipo ya Ada ya Mkopo',
          callback_url: 'http://localhost:3000/loan/complete',
          notification_id: 'weka_ipn_id_kama_unayo',
          billing_address: {
            email_address: email,
            phone_number: phoneNumber,
            country_code: 'TZ',
            first_name: firstName,
            last_name: lastName,
          },
        }),
      }
    );

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      return NextResponse.json(
        { error: orderData.message || 'Hitilafu katika kutuma oda' },
        { status: orderResponse.status }
      );
    }

    return NextResponse.json(orderData, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Hitilafu ya seva kwenye mfumo wa malipo' },
      { status: 500 }
    );
  }
}