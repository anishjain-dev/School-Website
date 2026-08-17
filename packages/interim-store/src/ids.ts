// App-minted ids (Nucleus convention: cuid/ulid, never serial). Globally
// unique, so rows keep their ids through the 3.0 migration copy.
import { createId } from '@paralleldrive/cuid2';

export const mintId = (): string => createId();
