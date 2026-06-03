import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST() {
  try {
    return new Promise((resolve) => {
      exec('bunx tsx prisma/seed.ts', { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          console.error('Seed error:', error, stderr);
          resolve(NextResponse.json({ error: 'Error al ejecutar seed' }, { status: 500 }));
          return;
        }
        resolve(NextResponse.json({ success: true, output: stdout }));
      });
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Error al ejecutar seed' }, { status: 500 });
  }
}
