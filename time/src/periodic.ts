import xs, {Stream, Listener} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

function makePeriodic(schedule: any, currentTime: () => number) {
  return function periodic(period: number): Stream<number> {
    let stopped = false;
    let lastEmitTime = 0;

    function scheduleNextEvent(
      entry: any,
      time: number,
      _schedule: any,
      _currentTime: () => number,
    ) {
      if (stopped) {
        return;
      }

      const value = entry.value + 1;

      _schedule.next(
        entry.stream,
        lastEmitTime + period,
        value,
        scheduleNextEvent,
      );

      lastEmitTime += period;
    }

    const producer = {
      listener: null as (Listener<any> | null),

      start(listener: Listener<any>) {
        producer.listener = listener;

        const timeToEmit = currentTime() + period;

        schedule.next(listener, timeToEmit, 0, scheduleNextEvent);

        lastEmitTime = timeToEmit;
      },

      stop() {
        stopped = true;
        schedule.completion(producer.listener, currentTime());
      },
    };

    return adapt(xs.create<number>(producer));
  };
}

export {makePeriodic};
