import { Canvas } from "@react-three/fiber";
import { ShaderPlane } from "./ui/background-paper-shaders";
import { Suspense } from "react";

export default function ThreeBackground() {
    return (
        <div className="fixed inset-0 -z-10 w-full h-full bg-black pointer-events-none">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    {/* Scale up the plane to cover the screen */}
                    <ShaderPlane position={[0, 0, 0]} color1="#10b981" color2="#000000" />
                </Suspense>
            </Canvas>
        </div>
    );
}
