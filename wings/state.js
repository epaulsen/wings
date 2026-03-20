import { STATES } from './constants.js';

export function createStateMachine()
{
    return {
        current: STATES.TITLE,
        previous: null,
        elapsed: 0,
        transition(newState)
        {
            this.previous = this.current;
            this.current = newState;
            this.elapsed = 0;
        },
        update(dt)
        {
            this.elapsed += dt;
        },
    };
}
