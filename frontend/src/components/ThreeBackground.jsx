import { Canvas } from "@react-three/fiber";
import { ShaderPlane } from "./ui/background-paper-shaders";
import { Suspense } from "react";

export default function ThreeBackground() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -10,
            pointerEvents: 'none',
            backgroundColor: 'black'
        }}>
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

