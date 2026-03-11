import { useState } from 'react';
import { X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const promptText = `Act as a Creative Computational Artist & High-Performance WebGL Shader Expert.

**YOUR GOAL:**
Write a single, highly optimized JavaScript function body that defines the movement behavior and visual appearance of particles in a massive 3D particles swarm simulation (20,000+ units).

**CONTEXT & API VARIABLES (Read-Only unless specified):**
1. \`i\` (Integer): Index of the current particle (0 to count-1).
2. \`count\` (Integer): Total number of particles.
3. \`target\` (THREE.Vector3): **WRITE-ONLY**. You MUST update this vector object (\`target.set(x,y,z)\`) to position the particle.
4. \`color\` (THREE.Color): **WRITE-ONLY**. You MUST update this color object (\`color.setHSL(...)\` or \`color.set(...)\`) to paint the particle.
5. \`time\` (Float): Global simulation time in seconds. Use this for animation.
6. \`THREE\`: The full Three.js library access.

**HELPER FUNCTIONS (Interactive UI):**
- \`addControl(id, label, min, max, initialValue)\`: Creates a real-time slider in the UI. Returns the current float value.
  *Example:* \`const speed = addControl("speed", "Rotation Speed", 0, 5, 1.0);\`
- \`setInfo(title, description)\`: Updates the HUD. **Call ONLY when \`i === 0\`**.
- \`annotate(id, positionVector, labelText)\`: Adds a floating 3D label. **Call ONLY when \`i === 0\`**.
  *Example:* \`annotate("center", new THREE.Vector3(0,0,0), "Singularity");\`

**CRITICAL PERFORMANCE RULES (STRICT COMPLIANCE REQUIRED):**
1. **ZERO GARBAGE COLLECTION:** This function runs 20,000 times *per frame* (60fps).
   - **NEVER** use \`new THREE.Vector3()\` or \`new THREE.Color()\` inside the loop (except for one-off annotations).
   - **NEVER** allocate arrays or objects inside the loop.
   - Reuse the provided \`target\` and \`color\` objects.
2. **MATH OVER LOGIC:** Avoid heavy branching (\`if/else\`) inside the loop. Use math functions (\`Math.sin\`, \`Math.cos\`, \`Math.abs\`) for shaping.
3. **OUTPUT ONLY:** Do not return any value. Just mutate \`target\` and \`color\`.
4. **ENVIRONMENT CONFLICTS:** Do not use variable names that conflict with the global environment.
   **NEVER** redefine or use common global names like \`SHADERS\`, \`THREE\`, \`Math\`, etc. inside your code.

**SECURITY & VALIDATION RULES (STRICT COMPLIANCE REQUIRED):**
Our simulator includes a multi-stage security and stability validator.

1. **FORBIDDEN PATTERNS:** Any code containing the following will be REJECTED:
   - \`document\`, \`window\`, \`fetch\`, \`XMLHttpRequest\`, \`WebSocket\`
   - \`eval\`, \`Function(\`, \`import(\`, \`require(\`, \`process\`
   - \`__proto__\`, \`.prototype\`, \`globalThis\`, \`self\`, \`location\`, \`navigator\`
   - \`localStorage\`, \`sessionStorage\`, \`indexedDB\`, \`crypto\`
   - \`setTimeout\`, \`setInterval\`, \`alert()\`, \`confirm()\`, \`prompt()\`

2. **STABILITY GATE:** The code must pass a dry-run execution without throwing ANY runtime errors.
3. **CONCISE & CLEAN:** Avoid extremely long variable names or deeply nested structures. Ensure the code is self-contained and does not use complex non-standard characters in comments that might disrupt database storage.

**VISUALIZATION GUIDELINES:**
- Create complex, organic, or mathematical structures (Fractals, Attractors, Fields, interference patterns).
- Use \`time\` to create smooth, flowing animation.
- Map \`i\` (index) to spatial coordinates to create continuous forms.
- Use \`addControl\` to make the visualization interactive (e.g., expanding size, changing chaos levels).

**REQUEST:**
[INSERT YOUR CREATIVE IDEA HERE - e.g., "A hyper-dimensional tesseract breathing in 4D space"]

**STRICT RESPONSE FORMAT:**
Return **ONLY** the JavaScript code for the function body. Do not include markdown formatting, backticks, or explanations before/after the code.

**EXAMPLE OUTPUT:**
const scale = addControl("scale", "Expansion", 10, 100, 50);
const angle = i * 0.1 + time;
target.set(Math.cos(angle) * scale, Math.sin(angle) * scale, i * 0.05);
color.setHSL(i / count, 1.0, 0.5);
if (i === 0) setInfo("Spiral Demo", "A basic test.");`;

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#111] border border-accent rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-accent">🎓 AI Educational Architect</h3>
            <p className="text-xs text-gray-400 mt-1">
              Copy this prompt to ChatGPT/Claude to generate simulations.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">
              {promptText}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-800">
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm",
              copied 
                ? "border-green-500 text-green-500" 
                : "border-accent text-accent hover:bg-accent/10"
            )}
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
