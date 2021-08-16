export type CompensateInterval = {
    stop: () => void;
};

export function compensateInterval(func: () => void, interval: number, runAtStart = true): CompensateInterval {
    let previousTime = Date.now();
    let stopped = false;
    function timeout() {
        if(!stopped) {
            func();
            previousTime += interval;
            setTimeout(timeout, previousTime - Date.now());
        }
    }
    if(runAtStart) {
        timeout();
    } else {
        setTimeout(timeout, interval);
    }
    return { stop: () => stopped = true };
}
