'use client';

import { useEffect, useState, useRef } from 'react';
import { FlatLayoutCanvas } from '@/src/components/FlatLayoutCanvas';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Box, Save } from 'lucide-react';
import Link from 'next/link';

export default function FlatLayoutPage() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <header className="h-14 border-b bg-white px-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/three">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Flat Layout Builder</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Save className="w-4 h-4" /> Save
          </Button>
          <Button className="gap-2">
            <Box className="w-4 h-4" /> Stitch to 3D
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-gray-100 relative overflow-hidden" ref={containerRef}>
        <div className="absolute inset-0">
             {/* Assuming FlatLayoutCanvas takes width/height props similar to Canvas2D or styles itself */}
             <FlatLayoutCanvas
               width={dimensions.width}
               height={dimensions.height}
             />
        </div>
      </main>
    </div>
  );
}
