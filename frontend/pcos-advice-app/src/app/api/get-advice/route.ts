import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const intake = await req.json();
    const backendRes = await fetch('http://localhost:8000/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intake),
    });
    if (!backendRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch advice from backend' }, { status: 500 });
    }
    const data = await backendRes.json();
    return NextResponse.json(data);
} 