import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  return NextResponse.json({ 
    status: 'online', 
    message: 'Capteur ESP32-CAM récepteur prêt' 
  });
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body - accept both raw text and JSON
    let base64Data: string;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const json = await request.json();
      base64Data = json.image;
    } else {
      // Raw text/plain base64
      base64Data = await request.text();
    }

    if (!base64Data || base64Data.trim().length === 0) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Strip data URI header if present
    base64Data = base64Data.replace(/^data:image\/\w+;base64,/, '').trim();

    console.log(`[Webhook] 📷 Reçu image ESP32: ${base64Data.length} caractères`);

    // Ensure public folder exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Save hardware capture directly to public/live-alert.jpg
    const imagePath = path.join(publicDir, 'live-alert.jpg');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(imagePath, imageBuffer);
    console.log(`[Webhook] ✅ Image sauvegardée: ${imagePath} (${imageBuffer.length} octets)`);

    // Update status.json with the direct hardware photo
    const status = {
      alertActive: true,
      timestamp: Date.now(),
      image: '/live-alert.jpg',
      meta: {
        imageSize: imageBuffer.length,
        source: 'ESP32-CAM'
      }
    };

    const statusPath = path.join(publicDir, 'status.json');
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    console.log(`[Webhook] 📷 Statut mis à jour avec la photo directe:`, status);

    return NextResponse.json(
      {
        success: true,
        message: 'Image reçue et affichée',
        imageUrl: status.image,
        timestamp: status.timestamp
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`[Webhook] ❌ Erreur:`, error);
    
    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
