import { getThreePhaseTourbillonTimer } from './src/lib/nudgeMath.ts';

const core = getThreePhaseTourbillonTimer(600, 0.2);

for (let elapsed = 595; elapsed <= 600; elapsed += 1) {
    const displayed = core.getDisplayedTime(elapsed);
    const remaining = 600 - displayed;
    const ceilRemaining = Math.ceil(remaining);
    console.log(`elapsed=${elapsed.toFixed(1)}, displayed=${displayed.toFixed(4)}, remaining=${remaining.toFixed(4)}, ceilRemaining=${ceilRemaining}`);
}
